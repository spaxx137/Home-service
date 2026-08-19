import { JobCard } from "@/components/technician/job-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTechnician } from "@/lib/technician";
import type { Customer } from "@/types/database";

const ACTIVE_STATUSES = ["assigned", "en_route", "in_progress"] as const;

export default async function TechnicianJobsPage() {
  const current = await getCurrentTechnician();
  if (!current) return null; // layout already redirects before this can happen

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("technician_id", current.technician.id)
    .order("preferred_date", { ascending: true });

  const activeJobs = (bookings ?? []).filter((b) => (ACTIVE_STATUSES as readonly string[]).includes(b.status));
  const pastJobs = (bookings ?? [])
    .filter((b) => !(ACTIVE_STATUSES as readonly string[]).includes(b.status))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const customerIds = [...new Set((bookings ?? []).map((b) => b.customer_id))];
  const { data: customers } = customerIds.length
    ? await supabase.from("customers").select("*").in("id", customerIds)
    : { data: [] as Customer[] };
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>

      <section className="mt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Active ({activeJobs.length})
        </h2>
        {activeJobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No active jobs right now.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {activeJobs.map((booking) => (
              <JobCard key={booking.id} booking={booking} customer={customerById.get(booking.customer_id) ?? null} />
            ))}
          </div>
        )}
      </section>

      {pastJobs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">History</h2>
          <div className="mt-3 space-y-4">
            {pastJobs.map((booking) => (
              <JobCard key={booking.id} booking={booking} customer={customerById.get(booking.customer_id) ?? null} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
