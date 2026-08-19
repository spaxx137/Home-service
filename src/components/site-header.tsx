import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            CJ
          </span>
          <span className="text-lg font-semibold text-slate-900">
            Ceejay Cellphone Repair
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/#services" className="hover:text-slate-900">
            Services
          </Link>
          <Link href="/#how-it-works" className="hover:text-slate-900">
            How It Works
          </Link>
          <Link href="/#branches" className="hover:text-slate-900">
            Branches
          </Link>
        </nav>
        <Link
          href="/book"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Book Now
        </Link>
      </div>
    </header>
  );
}
