export function SiteFooter() {
  return (
    <footer id="branches" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-900">Ceejay Cellphone Repair Shop</p>
            <p className="mt-2 text-sm text-slate-600">
              3 branches, plus daily home-service repairs across the metro.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Our Branches</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Branch 1</li>
              <li>Branch 2</li>
              <li>Branch 3</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Contact</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Home service bookings: use the form above</li>
              <li>Walk-ins welcome at any branch</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Ceejay Cellphone Repair Shop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
