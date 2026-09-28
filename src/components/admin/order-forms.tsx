"use client";

import { useState, useTransition } from "react";
import type { FulfilmentStatus } from "@/db/schema";
import { FormError, SelectField, TextField } from "@/components/auth/form-controls";
import type { FormState } from "@/lib/admin/authorize";
import { formatMoney } from "@/lib/format";
import { useFormAction } from "@/components/admin/use-form-action";

function Notice({ state }: { state: FormState }) {
  return (
    <>
      <FormError message={state.error} />
      {state.message && !state.error ? (
        <p role="status" className="text-body-sm text-success">{state.message}</p>
      ) : null}
    </>
  );
}

export function FulfilmentForm({
  status,
  carrier,
  trackingNumber,
  shipAction,
  setFulfilmentAction,
}: {
  status: FulfilmentStatus;
  carrier: string | null;
  trackingNumber: string | null;
  shipAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  setFulfilmentAction: (next: "delivered" | "unfulfilled") => Promise<FormState>;
}) {
  const [state, onSubmit, saving] = useFormAction(shipAction);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const setStatus = (next: "delivered" | "unfulfilled") =>
    startTransition(async () => {
      const result = await setFulfilmentAction(next);
      setError(result.error);
    });

  if (status === "delivered") {
    return (
      <p className="text-body-sm text-ink-muted">
        Delivered{carrier ? ` via ${carrier}` : ""}
        {trackingNumber ? ` · ${trackingNumber}` : ""}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Carrier"
            id="carrier"
            name="carrier"
            defaultValue={carrier ?? ""}
            placeholder="e.g. UPS"
            maxLength={60}
            list="carriers"
          />
          <datalist id="carriers">
            <option value="UPS" />
            <option value="FedEx" />
            <option value="USPS" />
            <option value="DHL" />
          </datalist>
          <TextField
            label="Tracking number"
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={trackingNumber ?? ""}
            maxLength={100}
          />
        </div>
        <Notice state={state} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {status === "shipped" ? "Update tracking" : "Mark as shipped"}
          </button>
          {status === "shipped" ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pending}
                onClick={() => setStatus("delivered")}
              >
                Mark as delivered
              </button>
              <button type="button" className="btn btn-sm" disabled={pending} onClick={() => setStatus("unfulfilled")}>
                Undo shipped
              </button>
            </>
          ) : null}
        </div>
      </form>
      <FormError message={error} />
    </div>
  );
}

export type RefundLine = {
  productId: number;
  name: string;
  quantity: number;
  restockable: number;
};

export function RefundForm({
  refundableCents,
  currency,
  lines,
  action,
}: {
  refundableCents: number;
  currency: string;
  lines: RefundLine[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [amount, setAmount] = useState((refundableCents / 100).toFixed(2));
  const [state, onSubmit, pending] = useFormAction(action, {
    resetOnSuccess: true,
    confirm: () =>
      window.confirm(
        `Refund ${formatMoney(Math.round(Number(amount) * 100), currency)} to the customer? This can’t be undone.`,
      ),
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Amount"
          id="amount"
          name="amount"
          inputMode="decimal"
          required
          pattern="\d+(\.\d{1,2})?"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          hint={`Up to ${formatMoney(refundableCents, currency)}`}
        />
        <SelectField label="Reason" id="reason" name="reason" defaultValue="requested_by_customer">
          <option value="requested_by_customer">Requested by customer</option>
          <option value="duplicate">Duplicate</option>
          <option value="fraudulent">Fraudulent</option>
          <option value="">Other</option>
        </SelectField>
      </div>

      {lines.some((line) => line.restockable > 0) ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="field-label">Return to stock</legend>
          {lines.map((line) => (
            <div key={line.productId} className="flex items-center justify-between gap-4 text-body-sm">
              <label htmlFor={`restock-${line.productId}`} className="min-w-0 truncate">
                {line.name}
                <span className="text-ink-subtle"> · {line.restockable} of {line.quantity} restockable</span>
              </label>
              <input
                id={`restock-${line.productId}`}
                name={`restock-${line.productId}`}
                type="number"
                min={0}
                max={line.restockable}
                defaultValue={0}
                disabled={line.restockable === 0}
                className="field w-20 shrink-0"
              />
            </div>
          ))}
        </fieldset>
      ) : null}

      <Notice state={state} />
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Refunding…" : "Issue refund"}
        </button>
      </div>
    </form>
  );
}
