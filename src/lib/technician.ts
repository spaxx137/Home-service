import "server-only";

import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Technician } from "@/types/database";

export interface CurrentTechnician {
  profile: Profile;
  technician: Technician;
}

export async function getCurrentTechnician(): Promise<CurrentTechnician | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "technician") return null;

  const supabase = await createClient();
  const { data: technician } = await supabase
    .from("technicians")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!technician) return null;

  return { profile, technician };
}
