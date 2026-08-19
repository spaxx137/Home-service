import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?redirect=/admin/bookings");
  }
  if (profile.role !== "admin") {
    redirect("/login?error=unauthorized");
  }

  return <AdminShell fullName={profile.full_name}>{children}</AdminShell>;
}
