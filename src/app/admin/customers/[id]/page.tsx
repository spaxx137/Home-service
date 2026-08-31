import Link from "next/link";
import { notFound } from "next/navigation";

import { AddFollowUpNote } from "@/components/admin/add-follow-up-note";
import { StatusBadge } from "@/components/admin/status-badge";
import { ISSUE_TYPE_LABELS, formatPhp } from "@/lib/constants";
import { getCustomerDetail } from "@/lib/admin/customers";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const { customer, bookings, notes } = detail;
  const totalSpend = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline">
        ← Back to Customers
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-slate-900">{customer.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Customer Info</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Phone" value={customer.phone} />
            <Row label="Email" value={customer.email} />
            <Row label="Address" value={customer.address} />
            <Row label="Total Bookings" value={String(bookings.length)} />
            <Row label="Total Spend" value={formatPhp(totalSpend)} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Follow-up Notes</h2>
          <div className="mt-3">
            <AddFollowUpNote customerId={customer.id} />
          </div>
          <div className="mt-4 space-y-3">
            {notes.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
            {notes.map((note) => (
              <div key={note.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <p className="text-slate-800">{note.note}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Booking History</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Issue</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No bookings yet.
                    </td>
                  </tr>
                )}
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {booking.reference_number}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{ISSUE_TYPE_LABELS[booking.issue_type]}</td>
                    <td className="py-2 pr-4 text-slate-700">{booking.preferred_date}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{booking.payment_status}</td>
                    <td className="py-2 pr-4 text-slate-700">{formatPhp(booking.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
