import type { ComponentProps } from "react";

export function TextField({
  label,
  id,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; id: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} className="field" aria-describedby={hintId} {...props} />
      {hint ? (
        <p id={hintId} className="mt-2 text-body-sm text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  return (
    <p role="alert" className="text-body-sm text-sale empty:hidden">
      {message}
    </p>
  );
}

export function FormNotice({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="border border-ink px-5 py-4 text-body">
      {children}
    </div>
  );
}

export function SelectField({
  label,
  id,
  hint,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; id: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="field" aria-describedby={hintId} {...props}>
        {children}
      </select>
      {hint ? (
        <p id={hintId} className="mt-2 text-body-sm text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextareaField({
  label,
  id,
  hint,
  ...props
}: ComponentProps<"textarea"> & { label: string; id: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea id={id} className="field py-3" aria-describedby={hintId} {...props} />
      {hint ? (
        <p id={hintId} className="mt-2 text-body-sm text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  label,
  id,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-body">
      <input id={id} type="checkbox" className="size-4 accent-ink" {...props} />
      {label}
    </label>
  );
}
