import type { BookingStatus, IssueType, TimeWindow } from "@/types/database";

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  screen_repair: "Screen Repair",
  battery: "Battery Replacement",
  water_damage: "Water Damage",
  charging_port: "Charging Port Repair",
  other: "Other / Not Sure",
};

/**
 * Estimated price (PHP) charged at booking time, per Spec.md Open Question 1
 * (default: show an estimated price per issue type and charge that amount
 * at booking). "other" has no fixed estimate, so a diagnostic fee is
 * charged instead and the remaining cost is settled after inspection.
 */
export const ISSUE_TYPE_ESTIMATES: Record<IssueType, number> = {
  screen_repair: 1500,
  battery: 900,
  water_damage: 2000,
  charging_port: 800,
  other: 150,
};

export const ISSUE_TYPE_ESTIMATE_NOTES: Record<IssueType, string> = {
  screen_repair: "Estimate for common phone models; final price confirmed by your technician.",
  battery: "Estimate for common phone models; final price confirmed by your technician.",
  water_damage: "Estimate for diagnosis + basic cleaning; parts may add to the cost.",
  charging_port: "Estimate for common phone models; final price confirmed by your technician.",
  other: "This covers the technician's diagnostic visit. Any repair cost is quoted on-site before work begins.",
};

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  morning: "Morning (8AM–12PM)",
  afternoon: "Afternoon (12PM–4PM)",
  evening: "Evening (4PM–8PM)",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  assigned: "Assigned",
  en_route: "En Route",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "new",
  "assigned",
  "en_route",
  "in_progress",
  "completed",
];

export function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateReferenceNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CJ-${y}${m}${d}-${random}`;
}
