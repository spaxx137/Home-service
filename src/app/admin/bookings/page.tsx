import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { BOOKING_STATUS_LABELS, ISSUE_TYPE_LABELS, formatPhp } from "@/lib/constants";
import { listBookings } from "@/lib/admin/bookings";
import type { BookingStatus } from "@/types/database";

const STATUS_OPTIONS: (BookingStatus | "all")[] = [
  "all",
  "new",
  "assigned",
  "en_route",
  "in_progress",
  "completed",
  "cancelled",
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const status = (params.status as BookingStatus | "all" | undefined) ?? "all";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const q = params.q ?? "";

  const items = await listBookings({ status, from: from || undefined, to: to || undefined, q: q || undefined });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <span className="text-sm text-slate-500">{items.length} result{items.length === 1 ? "" : "s"}</span>
      </div>

      <form className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : BOOKING_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">From</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">To</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Search name, phone, or reference</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Juan, 0917..., CJ-260819-AB12"
            className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="sm:col-span-4 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <Link
            href="/admin/bookings"
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Preferred</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No bookings match these filters.
                </td>
              </tr>
            )}
            {items.map(({ booking, customer, technician }) => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {booking.reference_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{customer?.name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{customer?.phone}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{ISSUE_TYPE_LABELS[booking.issue_type]}</td>
                <td className="px-4 py-3 text-slate-700">
                  {booking.preferred_date}
                  <div className="text-xs text-slate-500">{booking.preferred_time}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">{technician?.name ?? "Unassigned"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">{formatPhp(booking.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
