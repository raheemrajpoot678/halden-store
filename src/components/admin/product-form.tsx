"use client";

import { useState, useTransition } from "react";
import type { Photo, ProductStatus } from "@/db/schema";
import {
  FormError,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/auth/form-controls";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { UnsplashImage } from "@/components/unsplash-image";
import type { FormState } from "@/lib/admin/authorize";
import { useFormAction } from "@/components/admin/use-form-action";

export type ProductFormValues = {
  name: string;
  slug: string;
  categoryId: number | null;
  price: string;
  stock?: number;
  badge: string;
  colour: string;
  description: string;
  details: string;
  images: Photo[];
  status: ProductStatus;
};

function isUnsplash(src: string) {
  try {
    return new URL(src).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function ProductForm({
  values,
  categories,
  action,
  submitLabel,
}: {
  values: ProductFormValues;
  categories: { id: number; name: string }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, onSubmit, pending] = useFormAction(action);
  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));
  const [images, setImages] = useState<(Photo & { key: number })[]>(
    (values.images.length ? values.images : [{ src: "", alt: "" }]).map((image, key) => ({ ...image, key })),
  );
  const [nextKey, setNextKey] = useState(images.length);

  const updateImage = (key: number, change: Partial<Photo>) =>
    setImages((current) => current.map((image) => (image.key === key ? { ...image, ...change } : image)));

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-5 border p-5 md:p-6">
          <h2 className="ui-label">Details</h2>
          <TextField
            label="Name"
            id="name"
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
          <TextField
            label="URL slug"
            id="slug"
            name="slug"
            required
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            hint={`halden.com/products/${slug || "…"}`}
          />
          <TextareaField
            label="Description"
            id="description"
            name="description"
            required
            rows={5}
            maxLength={2000}
            defaultValue={values.description}
          />
          <TextareaField
            label="Details"
            id="details"
            name="details"
            rows={5}
            defaultValue={values.details}
            hint="One per line, e.g. materials, dimensions, care."
          />
        </section>

        <section className="flex flex-col gap-5 border p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="ui-label">Photos</h2>
            <p className="text-body-sm text-ink-subtle">The first photo is the cover.</p>
          </div>
          <ul className="flex flex-col gap-4">
            {images.map((image, index) => (
              <li key={image.key} className="grid grid-cols-[4rem_1fr_auto] items-start gap-4">
                <div className="media-frame">
                  {isUnsplash(image.src) ? (
                    <UnsplashImage src={image.src} alt="" fill sizes="64px" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="sr-only" htmlFor={`imageSrc-${image.key}`}>Photo {index + 1} URL</label>
                  <input
                    id={`imageSrc-${image.key}`}
                    name="imageSrc"
                    type="url"
                    className="field"
                    placeholder="https://images.unsplash.com/photo-…"
                    value={image.src}
                    onChange={(event) => updateImage(image.key, { src: event.target.value })}
                  />
                  <label className="sr-only" htmlFor={`imageAlt-${image.key}`}>Photo {index + 1} alt text</label>
                  <input
                    id={`imageAlt-${image.key}`}
                    name="imageAlt"
                    className="field"
                    placeholder="Describe the photo"
                    maxLength={200}
                    value={image.alt}
                    onChange={(event) => updateImage(image.key, { alt: event.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={images.length === 1}
                  onClick={() => setImages((current) => current.filter((item) => item.key !== image.key))}
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
          {images.length < 8 ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm self-start"
              onClick={() => {
                setImages((current) => [...current, { src: "", alt: "", key: nextKey }]);
                setNextKey(nextKey + 1);
              }}
            >
              <PlusIcon width={16} height={16} /> Add photo
            </button>
          ) : null}
          <p className="text-body-sm text-ink-subtle">
            Photos are served from Unsplash. Check them at full size: no readable brand names or logos.
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-5 border p-5 md:p-6">
          <h2 className="ui-label">Listing</h2>
          <SelectField label="Status" id="status" name="status" defaultValue={values.status}>
            <option value="active">Active: listed on the store</option>
            <option value="draft">Draft: hidden</option>
            <option value="archived">Archived: withdrawn</option>
          </SelectField>
          <SelectField
            label="Category"
            id="categoryId"
            name="categoryId"
            required
            defaultValue={values.categoryId ?? ""}
          >
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Price (USD)"
            id="price"
            name="price"
            required
            inputMode="decimal"
            defaultValue={values.price}
            placeholder="1250.00"
          />
          {values.stock !== undefined ? (
            <TextField
              label="Stock"
              id="stock"
              name="stock"
              type="number"
              min={0}
              required
              defaultValue={values.stock}
            />
          ) : null}
          <TextField label="Colour" id="colour" name="colour" required maxLength={60} defaultValue={values.colour} />
          <TextField
            label="Badge"
            id="badge"
            name="badge"
            maxLength={30}
            defaultValue={values.badge}
            hint="Optional, e.g. New or Exclusive."
          />
        </section>

        <div className="flex flex-col gap-3">
          <FormError message={state.error} />
          {state.message && !state.error ? (
            <p role="status" className="text-body-sm text-success">{state.message}</p>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// Quick status buttons on the edit page.
export function ProductStatusActions({
  status,
  action,
}: {
  status: ProductStatus;
  action: (status: ProductStatus) => Promise<FormState>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (next: ProductStatus) =>
    startTransition(async () => {
      const result = await action(next);
      setError(result.error);
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "active" ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => run("active")}>
            Publish
          </button>
        ) : null}
        {status === "active" ? (
          <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run("draft")}>
            Unpublish
          </button>
        ) : null}
        {status !== "archived" ? (
          <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run("archived")}>
            Archive
          </button>
        ) : null}
      </div>
      <FormError message={error} />
    </div>
  );
}

export function StockForm({
  stock,
  action,
}: {
  stock: number;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, onSubmit, pending] = useFormAction(action, { resetOnSuccess: true });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-title tabular-nums">{stock} in stock</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="delta" className="field-label">Add or remove</label>
          <input id="delta" name="delta" type="number" step={1} required placeholder="e.g. 10 or -2" className="field" />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          Update
        </button>
      </div>
      <FormError message={state.error} />
      {state.message && !state.error ? (
        <p role="status" className="text-body-sm text-success">{state.message}</p>
      ) : null}
    </form>
  );
}
