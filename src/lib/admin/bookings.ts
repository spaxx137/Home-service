import "server-only";

import { suggestTechnicians } from "@/lib/admin/matching";
import { createClient } from "@/lib/supabase/server";
import type { Booking, BookingStatus, Customer, Technician } from "@/types/database";

export interface BookingListFilters {
  status?: BookingStatus | "all";
  from?: string;
  to?: string;
  q?: string;
}

export interface BookingListItem {
  booking: Booking;
  customer: Pick<Customer, "id" | "name" | "phone"> | null;
  technician: Pick<Technician, "id" | "name"> | null;
  suggestedTechnicianName: string | null;
}

export async function listBookings(filters: BookingListFilters): Promise<BookingListItem[]> {
  const supabase = await createClient();

  let matchingCustomerIds: string[] | null = null;
  if (filters.q) {
    const { data: matches } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.%${filters.q}%,phone.ilike.%${filters.q}%`);
    matchingCustomerIds = (matches ?? []).map((row) => row.id);
  }

  let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.from) {
    query = query.gte("preferred_date", filters.from);
  }
  if (filters.to) {
    query = query.lte("preferred_date", filters.to);
  }
  if (filters.q) {
    const orParts = [`reference_number.ilike.%${filters.q}%`];
    if (matchingCustomerIds && matchingCustomerIds.length > 0) {
      orParts.push(`customer_id.in.(${matchingCustomerIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  const { data: bookings, error } = await query;
  if (error || !bookings) return [];

  const customerIds = [...new Set(bookings.map((b) => b.customer_id))];
  const technicianIds = [...new Set(bookings.map((b) => b.technician_id).filter((id): id is string => !!id))];

  const [{ data: customers }, { data: technicians }] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("*").in("id", customerIds)
      : Promise.resolve({ data: [] as Customer[] }),
    technicianIds.length
      ? supabase.from("technicians").select("id, name").in("id", technicianIds)
      : Promise.resolve({ data: [] as Pick<Technician, "id" | "name">[] }),
  ]);

  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));
  const technicianById = new Map((technicians ?? []).map((t) => [t.id, t]));

  // Only compute a live suggestion for unassigned "new" bookings — this is
  // the small daily-volume MVP case (Spec.md §1), so an N-query suggestion
  // pass per page load is an acceptable trade-off vs. the complexity of
  // batching it into one query.
  return Promise.all(
    bookings.map(async (booking) => {
      const customer = customerById.get(booking.customer_id) ?? null;
      const technician = booking.technician_id ? (technicianById.get(booking.technician_id) ?? null) : null;

      let suggestedTechnicianName: string | null = null;
      if (booking.status === "new" && !booking.technician_id && customer) {
        const { suggestions } = await suggestTechnicians(booking, customer);
        suggestedTechnicianName = suggestions[0]?.name ?? null;
      }

      return { booking, customer, technician, suggestedTechnicianName };
    }),
  );
}

export interface BookingDetail {
  booking: Booking;
  customer: Customer | null;
  technician: Technician | null;
}

export async function getBookingDetail(id: string): Promise<BookingDetail | null> {
  const supabase = await createClient();

  const { data: booking, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error || !booking) return null;

  const [{ data: customer }, { data: technician }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", booking.customer_id).maybeSingle(),
    booking.technician_id
      ? supabase.from("technicians").select("*").eq("id", booking.technician_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { booking, customer: customer ?? null, technician: technician ?? null };
}
