"use client";

import { useRef, useState, useTransition } from "react";

import { addFollowUpNote } from "@/app/admin/customers/actions";

export function AddFollowUpNote({ customerId }: { customerId: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addFollowUpNote(customerId, note);
      if (result.error) {
        setError(result.error);
      } else {
        setNote("");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="e.g. Offered promo, awaiting reply"
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !note.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add Note"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
