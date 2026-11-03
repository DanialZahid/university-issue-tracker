'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  submitComplaint,
  type SubmitComplaintState,
} from '@/actions/complaint';
import { detectCategory } from '@/automation/category-detection';
import { Alert, AlertDescription } from '@/ui/common/alert';
import { Button } from '@/ui/common/button';
import { Card, CardContent } from '@/ui/common/card';
import { FormField } from '@/ui/common/FormField';
import { Input } from '@/ui/common/input';
import { NativeSelect } from '@/ui/common/NativeSelect';
import { Textarea } from '@/ui/common/textarea';
import { collectFieldErrors, complaintSchema } from '@/schemas/complaint';

type Option = { id: string; name: string };
type CategoryOption = Option & { departmentName: string };
type Props = { categories: CategoryOption[]; locations: Option[] };

const initialState: SubmitComplaintState = { status: 'idle' };

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function ComplaintForm(props: Props) {
  const [formKey, setFormKey] = useState(0);
  return (
    <ComplaintFormFields
      key={formKey}
      {...props}
      onSubmitAnother={() => setFormKey((k) => k + 1)}
    />
  );
}

function ComplaintFormFields({
  categories,
  locations,
  onSubmitAnother,
}: Props & { onSubmitAnother: () => void }) {
  const [state, formAction, pending] = useActionState(
    submitComplaint,
    initialState,
  );

  // All fields are controlled so values survive a failed submit
  // (React resets uncontrolled fields after a form action).
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [manualCategoryId, setManualCategoryId] = useState<string | null>(null);

  // Detection runs locally and is cheap, so it is derived on every render.
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

  const live = complaintSchema.safeParse({
    title,
    description,
    categoryId,
    locationId,
    locationDetail,
    priority,
  });
  const errors: Record<string, string> =
    state.status === 'error' && !live.success
      ? collectFieldErrors(live.error)
      : {};

  const describedBy = (field: string) =>
    errors[field] ? `${field}-error` : undefined;

  if (state.status === 'success') {
    return (
      <Card>
        <CardContent className='flex flex-col items-start gap-4'>
          <CheckCircle2 className='size-8 text-green-600' />
          <div>
            <p className='text-lg font-semibold'>Complaint submitted</p>
            <p className='text-sm text-muted-foreground'>
              Your ticket number is{' '}
              <span className='font-medium text-foreground'>
                {state.ticket}
              </span>
              .
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button asChild>
              <Link href='/complaints'>View my complaints</Link>
            </Button>
            <Button variant='outline' onClick={onSubmitAnother}>
              Submit another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} noValidate className='space-y-6'>
      {state.status === 'error' && state.message && (
        <Alert variant='destructive'>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <FormField label='Title' htmlFor='title' error={errors['title']}>
        <Input
          id='title'
          name='title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          aria-invalid={!!errors['title']}
          aria-describedby={describedBy('title')}
        />
      </FormField>

      <FormField
        label='Description'
        htmlFor='description'
        error={errors['description']}
      >
        <Textarea
          id='description'
          name='description'
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          aria-invalid={!!errors['description']}
          aria-describedby={describedBy('description')}
        />
      </FormField>

      <FormField
        label='Category'
        htmlFor='categoryId'
        error={errors['categoryId']}
        hint={
          manualCategoryId === null
            ? 'Suggested from your text. You can change it.'
            : undefined
        }
      >
        <NativeSelect
          id='categoryId'
          name='categoryId'
          value={categoryId}
          onChange={(e) => setManualCategoryId(e.target.value)}
          aria-invalid={!!errors['categoryId']}
          aria-describedby={describedBy('categoryId')}
        >
          <option value=''>Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <div className='flex flex-wrap items-center justify-between gap-2 text-sm'>
          <p>
            <span className='text-muted-foreground'>Handled by: </span>
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
          error={errors['locationId']}
        >
          <NativeSelect
            id='locationId'
            name='locationId'
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            aria-invalid={!!errors['locationId']}
            aria-describedby={describedBy('locationId')}
          >
            <option value=''>Select a location</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          label='Room or details'
          htmlFor='locationDetail'
          optional
          error={errors['locationDetail']}
        >
          <Input
            id='locationDetail'
            name='locationDetail'
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            maxLength={100}
            aria-invalid={!!errors['locationDetail']}
            aria-describedby={describedBy('locationDetail')}
          />
        </FormField>
      </div>

      <FormField label='Priority' htmlFor='priority' error={errors['priority']}>
        <NativeSelect
          id='priority'
          name='priority'
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <FormField
        label='Attach an image'
        htmlFor='image'
        optional
        hint='Image attachments are coming soon.'
      >
        <Input id='image' type='file' accept='image/*' disabled />
      </FormField>

      <Button type='submit' disabled={pending}>
        {pending ? 'Submitting...' : 'Submit complaint'}
      </Button>
    </form>
  );
}
