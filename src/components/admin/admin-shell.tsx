import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

export function AdminShell({
  fullName,
  children,
}: {
  fullName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin/bookings" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                CJ
              </span>
              <span className="font-semibold text-slate-900">Admin Dashboard</span>
            </Link>
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 sm:flex">
              <Link href="/admin/bookings" className="hover:text-slate-900">
                Bookings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{fullName}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
