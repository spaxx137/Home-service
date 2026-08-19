"use client";

import { useState, useTransition } from "react";

import { setOnDutyStatus } from "@/app/technician/actions";

export function OnDutyToggle({
  technicianId,
  activeStatus,
}: {
  technicianId: string;
  activeStatus: boolean;
}) {
  const [onDuty, setOnDuty] = useState(activeStatus);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !onDuty;
    setOnDuty(next);
    startTransition(async () => {
      const result = await setOnDutyStatus(technicianId, next);
      if (result.error) setOnDuty(!next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        onDuty ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
      }`}
    >
      {onDuty ? "On Duty" : "Off Duty"}
    </button>
  );
}
