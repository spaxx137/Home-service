"use client";

import { useState, useTransition } from "react";

import { assignTechnician, updateBookingStatus } from "@/app/admin/bookings/actions";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types/database";

const STATUS_OPTIONS: BookingStatus[] = [
  "new",
  "assigned",
  "en_route",
  "in_progress",
  "completed",
  "cancelled",
];

export function StatusUpdateForm({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, status);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          className="mt-1 block rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {BOOKING_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending || status === currentStatus}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Update Status"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function TechnicianAssignForm({
  bookingId,
  currentTechnicianId,
  technicians,
}: {
  bookingId: string;
  currentTechnicianId: string | null;
  technicians: { id: string; name: string; service_zone: string }[];
}) {
  const [technicianId, setTechnicianId] = useState(currentTechnicianId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!technicianId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignTechnician(bookingId, technicianId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="text-xs font-medium text-slate-600">Technician</span>
        <select
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
          className="mt-1 block min-w-48 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Select a technician
          </option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name} — {tech.service_zone}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending || !technicianId || technicianId === currentTechnicianId}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Assigning..." : "Confirm Assignment"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
