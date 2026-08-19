"use client";

import { useTransition } from "react";
import { useState } from "react";

import { assignTechnician } from "@/app/admin/bookings/actions";
import type { TechnicianSuggestion } from "@/lib/admin/matching";

const RANK_LABELS = ["Best match", "2nd best", "3rd best"];

export function TechnicianSuggestions({
  bookingId,
  currentTechnicianId,
  suggestions,
  distanceAvailable,
}: {
  bookingId: string;
  currentTechnicianId: string | null;
  suggestions: TechnicianSuggestion[];
  distanceAvailable: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(technicianId: string) {
    setError(null);
    setPendingId(technicianId);
    startTransition(async () => {
      const result = await assignTechnician(bookingId, technicianId);
      if (result.error) setError(result.error);
      setPendingId(null);
    });
  }

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No active technicians available to suggest. Add technicians in Supabase or check them
        on-duty.
      </p>
    );
  }

  return (
    <div>
      {!distanceAvailable && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Distance ranking unavailable (address not geocoded yet — configure the Google Maps API
          key). Ranking by workload only.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {suggestions.map((suggestion, index) => {
          const isCurrent = suggestion.technicianId === currentTechnicianId;
          return (
            <div
              key={suggestion.technicianId}
              className={`rounded-lg border p-4 ${isCurrent ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {RANK_LABELS[index] ?? `#${index + 1}`}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{suggestion.name}</p>
              <p className="text-xs text-slate-500">{suggestion.serviceZone}</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <dt>Distance</dt>
                  <dd>{suggestion.distanceKm != null ? `${suggestion.distanceKm.toFixed(1)} km` : "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Active jobs today</dt>
                  <dd>{suggestion.activeJobCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Match score</dt>
                  <dd>{Math.round(suggestion.score * 100)}%</dd>
                </div>
              </dl>
              <button
                onClick={() => handleConfirm(suggestion.technicianId)}
                disabled={isPending || isCurrent}
                className="mt-3 w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCurrent ? "Assigned" : pendingId === suggestion.technicianId ? "Assigning..." : "Confirm"}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
