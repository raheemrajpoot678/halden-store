"use client";

import { useState, useTransition } from "react";
import { FormError, TextareaField, TextField } from "@/components/auth/form-controls";
import type { FormState } from "@/lib/admin/authorize";
import { useFormAction } from "@/components/admin/use-form-action";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
};

export function CategoryForm({
  idPrefix,
  values,
  action,
  submitLabel,
  resetOnSuccess = false,
}: {
  idPrefix: string;
  values: CategoryFormValues;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  resetOnSuccess?: boolean;
}) {
  const [state, onSubmit, pending] = useFormAction(action, { resetOnSuccess });
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Name" id={id("name")} name="name" required maxLength={60} defaultValue={values.name} />
        <TextField
          label="URL slug"
          id={id("slug")}
          name="slug"
          maxLength={60}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={values.slug}
          hint="Leave blank to generate it from the name."
        />
      </div>
      <TextareaField
        label="Description"
        id={id("description")}
        name="description"
        rows={2}
        maxLength={500}
        defaultValue={values.description}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Tile image URL"
          id={id("imageUrl")}
          name="imageUrl"
          type="url"
          placeholder="https://images.unsplash.com/photo-…"
          defaultValue={values.imageUrl}
          hint="Optional. Needed for a homepage tile."
        />
        <TextField label="Tile image alt text" id={id("imageAlt")} name="imageAlt" maxLength={200} defaultValue={values.imageAlt} />
      </div>
      <FormError message={state.error} />
      {state.message && !state.error ? (
        <p role="status" className="text-body-sm text-success">{state.message}</p>
      ) : null}
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function DeleteCategoryButton({
  name,
  disabled,
  action,
}: {
  name: string;
  disabled: boolean;
  action: () => Promise<FormState>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="btn btn-sm self-start text-sale"
        disabled={disabled || pending}
        title={disabled ? "Only empty categories can be deleted" : undefined}
        onClick={() =>
          startTransition(async () => {
            const result = await action();
            setError(result.error);
          })
        }
      >
        Delete {name}
      </button>
      <FormError message={error} />
    </div>
  );
}
