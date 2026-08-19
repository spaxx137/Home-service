"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/database";

export async function updateJobStatus(bookingId: string, status: BookingStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/technician");
  return { error: null };
}

export async function setOnDutyStatus(technicianId: string, activeStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("technicians")
    .update({ active_status: activeStatus })
    .eq("id", technicianId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/technician");
  return { error: null };
}
