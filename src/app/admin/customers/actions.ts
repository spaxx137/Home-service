"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function addFollowUpNote(customerId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) {
    return { error: "Note can't be empty." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return { error: "Not signed in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("follow_up_notes").insert({
    customer_id: customerId,
    note: trimmed,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  return { error: null };
}
