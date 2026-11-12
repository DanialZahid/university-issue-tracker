'use client';

import {
  startTransition,
  useActionState,
  useState,
  type ReactNode,
} from 'react';
import { Loader2, Send } from 'lucide-react';
import {
  submitComplaint,
  type SubmitComplaintState,
} from '@/actions/complaint';
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
import { IMAGE_LIMITS } from '@/schemas/attachment';
import { Hint } from '@/ui/common/Hint';
import { DepartmentIcon } from '@/ui/shared/department';
import { detectLocation } from '@/automation/location-detection';

type Option = { id: string; name: string };
type CategoryOption = Option & { departmentName: string };
type Props = {
  categories: CategoryOption[];
  locations: Option[];
  uploaderId: string;
  children?: ReactNode;
};

const initialState: SubmitComplaintState = { status: 'idle' };

export function ComplaintForm({
  categories,
  locations,
  uploaderId,
  children,
}: Props) {
  const [state, formAction, pending] = useActionState(
    submitComplaint,
    initialState,
  );
  const [uploading, setUploading] = useState(false);

  // All fields are controlled so values survive a failed submit
  // (React resets uncontrolled fields after a form action).
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [manualLocationId, setManualLocationId] = useState<string | null>(null);
  const [manualRoom, setManualRoom] = useState<string | null>(null);
  const [manualCategoryId, setManualCategoryId] = useState<string | null>(null);

  const suggestedCategoryId =
    title.trim().length >= 3
      ? (categories.find(
          (c) => c.name === detectCategory(title, description).category,
        )?.id ?? '')
      : '';
  const categoryId = manualCategoryId ?? suggestedCategoryId;
  const department = categories.find(
    (c) => c.id === categoryId,
  )?.departmentName;
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const priority = detectPriority(title, description, categoryName);

  const suggestedRoom = detectRoom(title, description) ?? '';
  const roomDetail = manualRoom ?? suggestedRoom;

  const suggestedLocationName = detectLocation(
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
          startTransition(() => formAction(formData));
        }}
        noValidate
        className='space-y-6 rounded-xl border bg-card p-6 shadow-xs'
      >
        <p className='text-sm text-muted-foreground'>
          Fields marked <span className='text-destructive'>*</span> are
          required.
        </p>

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
            manualCategoryId === null && suggestedCategoryId
              ? 'Suggested from your text. You can change it.'
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
            hint={
              manualLocationId === null && suggestedLocationId
                ? 'Suggested from your text. You can change it.'
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
            hint={
              manualRoom === null && suggestedRoom
                ? 'Suggested from your text. You can change it.'
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
            uploaderId={uploaderId}
            disabled={pending}
            onBusyChange={setUploading}
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
            Set automatically. The department may adjust it.
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
