"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  ISSUE_TYPE_ESTIMATES,
  ISSUE_TYPE_ESTIMATE_NOTES,
  ISSUE_TYPE_LABELS,
  TIME_WINDOW_LABELS,
  formatPhp,
} from "@/lib/constants";
import { bookingFormSchema } from "@/lib/validation/booking";
import type { IssueType, TimeWindow } from "@/types/database";

const ISSUE_TYPE_OPTIONS = Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][];
const TIME_WINDOW_OPTIONS = Object.entries(TIME_WINDOW_LABELS) as [TimeWindow, string][];

type FieldErrors = Partial<Record<string, string>>;

interface ConfirmationDetails {
  referenceNumber: string;
  amount: number;
  issueType: IssueType;
  preferredDate: string;
  preferredTime: TimeWindow;
}

const initialState = {
  fullName: "",
  mobileNumber: "",
  email: "",
  address: "",
  deviceInfo: "",
  issueType: "" as IssueType | "",
  issueDetails: "",
  preferredDate: "",
  preferredTime: "" as TimeWindow | "",
  notes: "",
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export function BookingForm() {
  const [values, setValues] = useState(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationDetails | null>(null);

  const estimate = useMemo(
    () => (values.issueType ? ISSUE_TYPE_ESTIMATES[values.issueType] : null),
    [values.issueType],
  );

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = bookingFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(parsed.data)) {
        formData.set(key, value ?? "");
      }
      if (photo) formData.set("photo", photo);

      const response = await fetch("/api/bookings", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.details) setErrors(payload.details);
        setSubmitError(payload.message ?? "Something went wrong. Please try again.");
        return;
      }

      if (payload.checkoutUrl) {
        // Hand off to PayMongo's hosted GCash/Maya checkout; it redirects
        // back to /book/payment-result when done.
        window.location.href = payload.checkoutUrl;
        return;
      }

      // No checkout URL means PayMongo isn't configured yet — fall back to
      // an in-page confirmation rather than blocking the booking.
      setConfirmation(payload);
    } catch {
      setSubmitError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return <BookingConfirmation confirmation={confirmation} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Field label="Full Name" error={errors.fullName} required>
        <input
          type="text"
          value={values.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          className={inputClass}
          placeholder="Juan Dela Cruz"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Mobile Number" error={errors.mobileNumber} required>
          <input
            type="tel"
            value={values.mobileNumber}
            onChange={(e) => update("mobileNumber", e.target.value)}
            className={inputClass}
            placeholder="0917 123 4567"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <Field label="Service Address" error={errors.address} required>
        <textarea
          value={values.address}
          onChange={(e) => update("address", e.target.value)}
          className={inputClass}
          rows={2}
          placeholder="House/unit no., street, barangay, city"
        />
      </Field>

      <Field label="Device Brand/Model" error={errors.deviceInfo} required>
        <input
          type="text"
          value={values.deviceInfo}
          onChange={(e) => update("deviceInfo", e.target.value)}
          className={inputClass}
          placeholder="e.g. iPhone 13, Samsung A54"
        />
      </Field>

      <Field label="Issue / Service Needed" error={errors.issueType} required>
        <select
          value={values.issueType}
          onChange={(e) => update("issueType", e.target.value as IssueType)}
          className={inputClass}
        >
          <option value="" disabled>
            Select an issue
          </option>
          {ISSUE_TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {estimate !== null && values.issueType && (
          <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Estimated cost: <span className="font-semibold">{formatPhp(estimate)}</span>.{" "}
            {ISSUE_TYPE_ESTIMATE_NOTES[values.issueType]}
          </p>
        )}
      </Field>

      <Field label="Describe the issue (optional)" error={errors.issueDetails}>
        <textarea
          value={values.issueDetails}
          onChange={(e) => update("issueDetails", e.target.value)}
          className={inputClass}
          rows={2}
          placeholder="Anything else that helps us understand the problem"
        />
      </Field>

      <Field label="Photo (optional)" error={errors.photo}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-1 text-xs text-slate-500">Helps your technician prep the right parts. Max 5MB.</p>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Preferred Date" error={errors.preferredDate} required>
          <input
            type="date"
            min={todayIso()}
            value={values.preferredDate}
            onChange={(e) => update("preferredDate", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Preferred Time Window" error={errors.preferredTime} required>
          <select
            value={values.preferredTime}
            onChange={(e) => update("preferredTime", e.target.value as TimeWindow)}
            className={inputClass}
          >
            <option value="" disabled>
              Select a time window
            </option>
            {TIME_WINDOW_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes (optional)" error={errors.notes}>
        <textarea
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={inputClass}
          rows={2}
          placeholder="Gate access, landmark, etc."
        />
      </Field>

      {submitError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Booking"}
      </button>
    </form>
  );
}

function BookingConfirmation({ confirmation }: { confirmation: ConfirmationDetails }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl text-white">
        ✓
      </div>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Booking Received!</h2>
      <p className="mt-2 text-slate-600">
        Your reference number is{" "}
        <span className="font-mono font-semibold text-slate-900">{confirmation.referenceNumber}</span>.
        Save this for your records.
      </p>
      <dl className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
        <div className="flex justify-between border-b border-green-100 pb-2">
          <dt className="text-slate-500">Service</dt>
          <dd className="font-medium text-slate-900">{ISSUE_TYPE_LABELS[confirmation.issueType]}</dd>
        </div>
        <div className="flex justify-between border-b border-green-100 pb-2">
          <dt className="text-slate-500">Estimated Cost</dt>
          <dd className="font-medium text-slate-900">{formatPhp(confirmation.amount)}</dd>
        </div>
        <div className="flex justify-between border-b border-green-100 pb-2">
          <dt className="text-slate-500">Preferred Date</dt>
          <dd className="font-medium text-slate-900">{confirmation.preferredDate}</dd>
        </div>
        <div className="flex justify-between pb-2">
          <dt className="text-slate-500">Time Window</dt>
          <dd className="font-medium text-slate-900">{TIME_WINDOW_LABELS[confirmation.preferredTime]}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-slate-600">
        Our team will reach out shortly to confirm your appointment and technician.
      </p>
    </div>
  );
}

const inputClass =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
