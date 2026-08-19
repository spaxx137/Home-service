"use client";

import { useState, useTransition } from "react";

import { updateJobStatus } from "@/app/technician/actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { ISSUE_TYPE_LABELS, TIME_WINDOW_LABELS, formatPhp } from "@/lib/constants";
import type { Booking, BookingStatus, Customer } from "@/types/database";

const NEXT_STATUS: Partial<Record<BookingStatus, { status: BookingStatus; label: string }>> = {
  assigned: { status: "en_route", label: "Start En Route" },
  en_route: { status: "in_progress", label: "Arrived — Start Job" },
  in_progress: { status: "completed", label: "Mark Completed" },
};

export function JobCard({ booking, customer }: { booking: Booking; customer: Customer | null }) {
  const [status, setStatus] = useState(booking.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const next = NEXT_STATUS[status];

  function handleAdvance() {
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateJobStatus(booking.id, next.status);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus(next.status);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-slate-500">{booking.reference_number}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 font-semibold text-slate-900">{customer?.name ?? "Unknown customer"}</p>
      <p className="text-sm text-slate-600">{customer?.phone}</p>
      <p className="text-sm text-slate-600">{customer?.address}</p>

      <dl className="mt-3 space-y-1 text-sm text-slate-600">
        <div className="flex justify-between">
          <dt>Device</dt>
          <dd className="text-right font-medium text-slate-900">{booking.device_info}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Issue</dt>
          <dd className="text-right font-medium text-slate-900">
            {ISSUE_TYPE_LABELS[booking.issue_type]}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>When</dt>
          <dd className="text-right font-medium text-slate-900">
            {booking.preferred_date} · {TIME_WINDOW_LABELS[booking.preferred_time]}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Amount</dt>
          <dd className="text-right font-medium text-slate-900">{formatPhp(booking.amount)}</dd>
        </div>
      </dl>

      {booking.notes && (
        <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium">Notes: </span>
          {booking.notes}
        </p>
      )}

      {next && (
        <button
          onClick={handleAdvance}
          disabled={isPending}
          className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Updating..." : next.label}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
