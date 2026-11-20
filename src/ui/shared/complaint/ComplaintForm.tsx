'use client';

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { CalendarClock, History, Loader2, Send } from 'lucide-react';
import {
  submitComplaint,
  type SubmitComplaintState,
} from '@/actions/complaint';
import { suggestFields, type FieldSuggestion } from '@/actions/suggest';
import { detectCategory } from '@/automation/category-detection';
import { detectRoom } from '@/automation/room-detection';
import {
  LIMITS,
  NO_PLACE,
  collectFieldErrors,
  complaintSchema,
} from '@/schemas/complaint';
import { Alert, AlertDescription } from '@/ui/common/alert';
import { Button } from '@/ui/common/button';
import { FormField } from '@/ui/common/FormField';
import { Input } from '@/ui/common/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/common/select';
import { Textarea } from '@/ui/common/textarea';
import { detectPriority } from '@/automation/priority-detection';
import { PriorityBadge } from './PriorityBadge';
import { SimilarIssues } from './SimilarIssues';
import { ImagePicker } from './ImagePicker';
import { IMAGE_LIMITS, type AttachmentInput } from '@/schemas/attachment';
import {
  clearDraft,
  readDraft,
  saveDraft,
  type ComplaintDraft,
} from '@/utils/complaint-draft';
import { formatDateTime, formatRecent, isoDate } from '@/utils/date';
import { Hint } from '@/ui/common/Hint';
import { DepartmentIcon } from '@/ui/shared/department';
import { detectLocation } from '@/automation/location-detection';

type Option = { id: string; name: string };
type CategoryOption = Option & { departmentName: string };
type Props = {
  categories: CategoryOption[];
  locations: Option[];
  uploaderId: string;
  // True when the AI layer is switched on (AI_FEATURES=on).
  aiEnabled?: boolean;
  children?: ReactNode;
};

const AI_PAUSE_MS = 1200;

const initialState: SubmitComplaintState = { status: 'idle' };

const noSubscribe = () => () => {};

function savedLabel(savedAt: number) {
  const when = formatRecent(new Date(savedAt));
  return `Saved ${when === 'Just now' ? 'just now' : when}`;
}

// The draft lives in browser storage, which the server cannot read. The
// server and the first browser render show an empty form; right after
// hydration the form remounts once with the saved draft, if there is one.
export function ComplaintForm(props: Props) {
  const inBrowser = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  return (
    <FormBody
      key={inBrowser ? 'browser' : 'server'}
      {...props}
      draftEnabled={inBrowser}
    />
  );
}

function FormBody({
  categories,
  locations,
  uploaderId,
  aiEnabled = false,
  children,
  draftEnabled,
}: Props & { draftEnabled: boolean }) {
  const [restored] = useState<ComplaintDraft | null>(() =>
    draftEnabled ? readDraft(uploaderId) : null,
  );
  const [state, formAction, pending] = useActionState(
    submitComplaint,
    initialState,
  );
  const [uploading, setUploading] = useState(false);

  // All fields are controlled so values survive a failed submit
  // (React resets uncontrolled fields after a form action).
  const [title, setTitle] = useState(restored?.title ?? '');
  const [description, setDescription] = useState(restored?.description ?? '');
  const [manualLocationId, setManualLocationId] = useState<string | null>(
    restored?.locationId ?? null,
  );
  const [manualRoom, setManualRoom] = useState<string | null>(
    restored?.room ?? null,
  );
  const [manualCategoryId, setManualCategoryId] = useState<string | null>(
    restored?.categoryId ?? null,
  );
  const [attachments, setAttachments] = useState<AttachmentInput[]>(
    restored?.attachments ?? [],
  );

  // Saved while typing, cleared on submit, and saved again if it fails.
  const [restoredAt, setRestoredAt] = useState(restored?.savedAt ?? null);
  const [initialImages, setInitialImages] = useState(
    restored?.attachments ?? [],
  );
  // A new key remounts the picker so it drops discarded images.
  const [pickerKey, setPickerKey] = useState(0);
  const submitting = useRef(false);

  const draft = {
    title,
    description,
    categoryId: manualCategoryId,
    locationId: manualLocationId,
    room: manualRoom,
    attachments,
  };
  const draftJson = JSON.stringify(draft);

  useEffect(() => {
    if (!draftEnabled || submitting.current) return;
    const timer = setTimeout(
      () => saveDraft(uploaderId, JSON.parse(draftJson)),
      400,
    );
    return () => clearTimeout(timer);
  }, [draftJson, draftEnabled, uploaderId]);

  useEffect(() => {
    if (!draftEnabled || state.status !== 'error') return;
    submitting.current = false;
    saveDraft(uploaderId, JSON.parse(draftJson));
    // Only when a new result arrives, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Warn before a refresh or closing the tab. Moving between app pages does
  // not trigger this, which is what the saved draft covers.
  const hasWork =
    uploading ||
    !!title.trim() ||
    !!description.trim() ||
    attachments.length > 0;
  useEffect(() => {
    if (!hasWork) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (submitting.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasWork]);

  function discardDraft() {
    clearDraft(uploaderId);
    setTitle('');
    setDescription('');
    setManualCategoryId(null);
    setManualLocationId(null);
    setManualRoom(null);
    setInitialImages([]);
    setAttachments([]);
    setPickerKey((k) => k + 1);
    setRestoredAt(null);
  }

  // AI suggestions: asked once typing pauses. The last answer stays until a
  // newer one arrives, so the fields do not flicker back to the rules.
  const [ai, setAi] = useState<FieldSuggestion | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const aiReady =
    aiEnabled &&
    title.trim().length >= LIMITS.title.min &&
    description.trim().length >= LIMITS.description.min;
  const aiKey = `${title.trim()}\n${description.trim()}`;
  const lastAsked = useRef('');
  useEffect(() => {
    if (!aiReady || lastAsked.current === aiKey) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      lastAsked.current = aiKey;
      setAiBusy(true);
      try {
        const answer = await suggestFields({ title, description });
        if (!cancelled && answer) setAi(answer);
      } catch {
        // Keep the rule-based suggestions.
      } finally {
        if (!cancelled) setAiBusy(false);
      }
    }, AI_PAUSE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiReady, aiKey, title, description]);
  const aiValue = aiReady ? ai : null;
  const suggestedBy = aiValue
    ? 'Suggested by AI from your text. You can change it.'
    : 'Suggested from your text. You can change it.';

  const ruleCategoryId =
    title.trim().length >= 3
      ? (categories.find(
          (c) => c.name === detectCategory(title, description).category,
        )?.id ?? '')
      : '';
  const suggestedCategoryId =
    (aiValue && categories.find((c) => c.name === aiValue.category)?.id) ||
    ruleCategoryId;
  const categoryId = manualCategoryId ?? suggestedCategoryId;
  const department = categories.find(
    (c) => c.id === categoryId,
  )?.departmentName;
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const priority =
    aiValue?.priority ?? detectPriority(title, description, categoryName);

  const suggestedRoom = aiValue
    ? (aiValue.room ?? '')
    : (detectRoom(title, description) ?? '');
  const roomDetail = manualRoom ?? suggestedRoom;

  const suggestedLocationName = aiValue
    ? aiValue.location
    : detectLocation(
        title,
        description,
        locations.map((l) => l.name),
      );
  const suggestedLocationId =
    locations.find((l) => l.name === suggestedLocationName)?.id ?? '';
  const locationId = manualLocationId ?? suggestedLocationId;
  // Empty Location is saved as "No specific place"; similar issues use it too.
  const noPlaceId = locations.find((l) => l.name === NO_PLACE)?.id ?? '';
  const placeOptions = [
    ...locations.filter((l) => l.name !== NO_PLACE),
    ...locations.filter((l) => l.name === NO_PLACE),
  ];

  const live = complaintSchema.safeParse({
    title,
    description,
    categoryId,
    locationId,
    locationDetail: roomDetail,
  });
  const errors: Record<string, string> =
    state.status === 'error' && !live.success
      ? collectFieldErrors(live.error)
      : {};
  const describedBy = (field: string) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          submitting.current = true;
          clearDraft(uploaderId);
          startTransition(() => formAction(formData));
        }}
        noValidate
        className='space-y-6 rounded-xl border bg-card p-6 shadow-xs'
      >
        <p className='text-sm text-muted-foreground'>
          Fields marked <span className='text-destructive'>*</span> are
          required.
        </p>

        {restoredAt !== null && (
          <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 py-2 pr-2 pl-3 text-sm text-amber-900'>
            <p className='inline-flex flex-wrap items-center gap-x-2 gap-y-1'>
              <History className='size-4 shrink-0 text-amber-600' />
              <span className='font-medium'>Draft restored.</span>
              <Hint label={formatDateTime(new Date(restoredAt))}>
                <time
                  dateTime={isoDate(restoredAt)}
                  className='inline-flex items-center gap-1 text-amber-800'
                >
                  <CalendarClock className='size-3.5' />
                  {savedLabel(restoredAt)}
                </time>
              </Hint>
            </p>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-amber-900 hover:bg-amber-100 hover:text-amber-950'
              onClick={discardDraft}
            >
              Discard draft
            </Button>
          </div>
        )}

        {state.status === 'error' && state.message && (
          <Alert variant='destructive'>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          label='Title'
          htmlFor='title'
          required
          error={errors['title']}
          hint={`${LIMITS.title.min} to ${LIMITS.title.max} characters.`}
          count={{ current: title.length, max: LIMITS.title.max }}
        >
          <Input
            id='title'
            name='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.title.max}
            aria-invalid={!!errors['title']}
            aria-describedby={describedBy('title')}
          />
        </FormField>

        <FormField
          label='Description'
          htmlFor='description'
          required
          error={errors['description']}
          hint={`${LIMITS.description.min} to ${LIMITS.description.max} characters.`}
          count={{ current: description.length, max: LIMITS.description.max }}
        >
          <Textarea
            id='description'
            name='description'
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={LIMITS.description.max}
            aria-invalid={!!errors['description']}
            aria-describedby={describedBy('description')}
          />
        </FormField>

        <FormField
          label='Category'
          htmlFor='categoryId'
          required
          error={errors['categoryId']}
          hint={
            aiBusy
              ? 'Checking with AI…'
              : manualCategoryId === null && suggestedCategoryId
                ? suggestedBy
                : undefined
          }
        >
          <Select
            name='categoryId'
            value={categoryId}
            onValueChange={setManualCategoryId}
          >
            <SelectTrigger
              id='categoryId'
              className='w-full'
              aria-invalid={!!errors['categoryId']}
              aria-describedby={describedBy('categoryId')}
            >
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent position='popper'>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
            <p className='inline-flex items-center gap-1.5'>
              <span className='text-muted-foreground'>Handled by:</span>
              {department && (
                <DepartmentIcon
                  name={department}
                  className='size-4 text-muted-foreground'
                />
              )}
              <span className='font-medium'>
                {department ?? 'Not selected yet'}
              </span>
            </p>
            {manualCategoryId !== null && (
              <Button
                type='button'
                variant='link'
                size='sm'
                onClick={() => setManualCategoryId(null)}
              >
                Use suggested category
              </Button>
            )}
          </div>
        </FormField>

        <div className='grid gap-6 sm:grid-cols-2'>
          <FormField
            label='Location'
            htmlFor='locationId'
            optional
            error={errors['locationId']}
            action={
              manualLocationId !== null &&
              suggestedLocationId &&
              manualLocationId !== suggestedLocationId && (
                <SuggestionLink onClick={() => setManualLocationId(null)}>
                  Use suggested location
                </SuggestionLink>
              )
            }
            hint={
              manualLocationId === null && suggestedLocationId
                ? suggestedBy
                : 'Leave empty for website, online, or campus-wide issues.'
            }
          >
            <Select
              name='locationId'
              value={locationId}
              onValueChange={setManualLocationId}
            >
              <SelectTrigger
                id='locationId'
                className='w-full'
                aria-invalid={!!errors['locationId']}
                aria-describedby={describedBy('locationId')}
              >
                <SelectValue placeholder={NO_PLACE} />
              </SelectTrigger>
              <SelectContent position='popper'>
                {placeOptions.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label='Room'
            htmlFor='locationDetail'
            optional
            error={errors['locationDetail']}
            action={
              manualRoom !== null &&
              suggestedRoom &&
              manualRoom !== suggestedRoom && (
                <SuggestionLink onClick={() => setManualRoom(null)}>
                  Use suggested room
                </SuggestionLink>
              )
            }
            hint={
              manualRoom === null && suggestedRoom
                ? suggestedBy
                : 'For example: AC-103 or C-Lab 04.'
            }
          >
            <Input
              id='locationDetail'
              name='locationDetail'
              value={roomDetail}
              onChange={(e) => setManualRoom(e.target.value)}
              maxLength={LIMITS.locationDetail.max}
              aria-invalid={!!errors['locationDetail']}
              aria-describedby={describedBy('locationDetail')}
            />
          </FormField>
        </div>

        <FormField
          label='Images'
          htmlFor='images'
          optional
          hint={`Up to ${IMAGE_LIMITS.maxFiles} JPG, PNG, or WebP images, ${IMAGE_LIMITS.maxInputBytes / (1024 * 1024)} MB each.`}
        >
          <ImagePicker
            key={pickerKey}
            uploaderId={uploaderId}
            disabled={pending}
            onBusyChange={setUploading}
            initial={initialImages}
            onChange={setAttachments}
          />
        </FormField>

        <div className='flex flex-wrap items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Priority:</span>
          <Hint label='Based on your title, description, and category.'>
            <span className='inline-flex'>
              <PriorityBadge priority={priority} />
            </span>
          </Hint>
          <span className='text-muted-foreground'>
            {aiValue
              ? 'Set automatically with AI. The department may adjust it.'
              : 'Set automatically. The department may adjust it.'}
          </span>
        </div>

        <Button type='submit' disabled={pending || uploading}>
          {pending || uploading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <Send />
          )}
          {pending
            ? 'Submitting...'
            : uploading
              ? 'Uploading images...'
              : 'Submit complaint'}
        </Button>
      </form>
      <div className='space-y-6'>
        <SimilarIssues
          title={title}
          categoryId={categoryId}
          locationId={locationId || noPlaceId}
          room={roomDetail}
        />
        {children}
      </div>
    </div>
  );
}

// Your own choice wins over the suggestion while you keep typing. This puts
// the suggestion back.
function SuggestionLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type='button'
      variant='link'
      size='sm'
      className='h-auto shrink-0 p-0'
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
