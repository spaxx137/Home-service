import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin/status-badge";
import { StatusUpdateForm, TechnicianAssignForm } from "@/components/admin/booking-actions";
import {
  ISSUE_TYPE_LABELS,
  TIME_WINDOW_LABELS,
  formatPhp,
} from "@/lib/constants";
import { getBookingDetail } from "@/lib/admin/bookings";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getBookingDetail(id);
  if (!detail) notFound();

  const { booking, customer, technician } = detail;

  const supabase = await createClient();
  const { data: technicians } = await supabase
    .from("technicians")
    .select("id, name, service_zone")
    .eq("active_status", true)
    .order("name");

  return (
    <div>
      <Link href="/admin/bookings" className="text-sm text-blue-600 hover:underline">
        ← Back to Bookings
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{booking.reference_number}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name" value={customer?.name ?? "—"} />
            <Row label="Phone" value={customer?.phone ?? "—"} />
            <Row label="Email" value={customer?.email ?? "—"} />
            <Row label="Address" value={customer?.address ?? "—"} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Service Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Device" value={booking.device_info} />
            <Row label="Issue" value={ISSUE_TYPE_LABELS[booking.issue_type]} />
            <Row label="Details" value={booking.issue_details || "—"} />
            <Row
              label="Preferred"
              value={`${booking.preferred_date} · ${TIME_WINDOW_LABELS[booking.preferred_time]}`}
            />
            <Row label="Notes" value={booking.notes || "—"} />
            <Row label="Estimated Amount" value={formatPhp(booking.amount)} />
            <Row label="Payment Status" value={booking.payment_status} />
          </dl>
          {booking.photo_url && (
            <a
              href={booking.photo_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              View uploaded photo
            </a>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Status</h2>
          <p className="mt-1 text-sm text-slate-500">Update this booking&apos;s lifecycle stage.</p>
          <div className="mt-4">
            <StatusUpdateForm bookingId={booking.id} currentStatus={booking.status} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Technician Assignment</h2>
          <p className="mt-1 text-sm text-slate-500">
            {technician ? `Currently assigned to ${technician.name}.` : "No technician assigned yet."}
          </p>
          <div className="mt-4">
            <TechnicianAssignForm
              bookingId={booking.id}
              currentTechnicianId={booking.technician_id}
              technicians={technicians ?? []}
            />
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
