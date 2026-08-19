import Link from "next/link";

import { formatPhp } from "@/lib/constants";
import { listCustomers } from "@/lib/admin/customers";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";

  const items = await listCustomers(q || undefined);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <span className="text-sm text-slate-500">{items.length} result{items.length === 1 ? "" : "s"}</span>
      </div>

      <form className="mt-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone"
          className="block w-full max-w-sm rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
        {q && (
          <Link
            href="/admin/customers"
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Bookings</th>
              <th className="px-4 py-3">Total Spend</th>
              <th className="px-4 py-3">Last Booking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No customers match this search.
                </td>
              </tr>
            )}
            {items.map(({ customer, bookingCount, totalSpend, lastBookingDate }) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{customer.phone}</td>
                <td className="px-4 py-3 text-slate-700">{bookingCount}</td>
                <td className="px-4 py-3 text-slate-700">{formatPhp(totalSpend)}</td>
                <td className="px-4 py-3 text-slate-700">{lastBookingDate ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
