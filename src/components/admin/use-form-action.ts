"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/admin/authorize";

const initial: FormState = { error: null, message: null };

// useActionState without React's automatic form reset: a <form action> clears
// its fields after every submission, which would throw away the admin's input
// when validation fails. Pass `resetOnSuccess` for "add another" forms.
export function useFormAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  { resetOnSuccess = false, confirm }: { resetOnSuccess?: boolean; confirm?: (formData: FormData) => boolean } = {},
) {
  const [state, dispatch, pending] = useActionState(
    async (prev: FormState, { formData, form }: { formData: FormData; form: HTMLFormElement }) => {
      const result = await action(prev, formData);
      if (resetOnSuccess && !result.error) form.reset();
      return result;
    },
    initial,
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (confirm && !confirm(formData)) return;
    startTransition(() => dispatch({ formData, form }));
  };

  return [state, onSubmit, pending] as const;
}
