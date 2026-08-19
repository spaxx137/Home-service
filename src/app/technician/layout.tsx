import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { getCurrentProfile } from "@/lib/auth";
import { getCurrentTechnician } from "@/lib/technician";
import { OnDutyToggle } from "@/components/technician/on-duty-toggle";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?redirect=/technician");
  }
  if (profile.role !== "technician") {
    redirect("/login?error=unauthorized");
  }

  const current = await getCurrentTechnician();
  if (!current) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="font-semibold text-slate-900">{current.technician.name}</p>
            <p className="text-xs text-slate-500">{current.technician.service_zone}</p>
          </div>
          <div className="flex items-center gap-3">
            <OnDutyToggle
              technicianId={current.technician.id}
              activeStatus={current.technician.active_status}
            />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
