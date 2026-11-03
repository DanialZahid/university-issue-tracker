import { startTransition, type FormEvent } from 'react';

// Submits through useActionState without React's automatic form reset,
// which would otherwise snap Radix selects back to their first value.
export function submitWithoutReset(dispatch: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
