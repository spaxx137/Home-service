import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/types/database";

const STATUS_STYLES: Record<BookingStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  assigned: "bg-purple-100 text-purple-800",
  en_route: "bg-amber-100 text-amber-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-slate-200 text-slate-600",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
