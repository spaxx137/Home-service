import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Booking, Customer, FollowUpNote } from "@/types/database";

export interface CustomerListItem {
  customer: Customer;
  bookingCount: number;
  totalSpend: number;
  lastBookingDate: string | null;
}

export async function listCustomers(q?: string): Promise<CustomerListItem[]> {
  const supabase = await createClient();

  let query = supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: customers, error } = await query;
  if (error || !customers) return [];

  const customerIds = customers.map((c) => c.id);
  const { data: bookings } = customerIds.length
    ? await supabase
        .from("bookings")
        .select("customer_id, amount, payment_status, preferred_date")
        .in("customer_id", customerIds)
    : { data: [] as Pick<Booking, "customer_id" | "amount" | "payment_status" | "preferred_date">[] };

  const statsByCustomer = new Map<string, { count: number; spend: number; lastDate: string | null }>();
  for (const booking of bookings ?? []) {
    const stats = statsByCustomer.get(booking.customer_id) ?? { count: 0, spend: 0, lastDate: null };
    stats.count += 1;
    if (booking.payment_status === "paid") stats.spend += booking.amount;
    if (!stats.lastDate || booking.preferred_date > stats.lastDate) stats.lastDate = booking.preferred_date;
    statsByCustomer.set(booking.customer_id, stats);
  }

  return customers.map((customer) => {
    const stats = statsByCustomer.get(customer.id);
    return {
      customer,
      bookingCount: stats?.count ?? 0,
      totalSpend: stats?.spend ?? 0,
      lastBookingDate: stats?.lastDate ?? null,
    };
  });
}

export interface CustomerDetail {
  customer: Customer;
  bookings: Booking[];
  notes: FollowUpNote[];
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error || !customer) return null;

  const [{ data: bookings }, { data: notes }] = await Promise.all([
    supabase.from("bookings").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase
      .from("follow_up_notes")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return { customer, bookings: bookings ?? [], notes: notes ?? [] };
}
