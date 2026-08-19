"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { error: null };
}

export async function assignTechnician(bookingId: string, technicianId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ technician_id: technicianId, status: "assigned" })
    .eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { error: null };
}
