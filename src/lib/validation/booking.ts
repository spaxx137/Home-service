import { z } from "zod";

// Accepts 09XXXXXXXXX or +639XXXXXXXXX (PH mobile format).
const PH_MOBILE_REGEX = /^(?:\+63|0)9\d{9}$/;

export function normalizePhMobile(raw: string): string {
  const digits = raw.trim();
  if (digits.startsWith("+63")) return digits;
  if (digits.startsWith("0")) return `+63${digits.slice(1)}`;
  return digits;
}

export const issueTypeValues = [
  "screen_repair",
  "battery",
  "water_damage",
  "charging_port",
  "other",
] as const;

export const timeWindowValues = ["morning", "afternoon", "evening"] as const;

export const bookingFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  mobileNumber: z
    .string()
    .trim()
    .regex(PH_MOBILE_REGEX, "Enter a valid PH mobile number, e.g. 0917 123 4567"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  address: z.string().trim().min(10, "Enter your full service address").max(500),
  deviceInfo: z.string().trim().min(2, "Enter your device brand/model").max(120),
  issueType: z.enum(issueTypeValues, "Select an issue"),
  issueDetails: z.string().trim().max(1000).optional(),
  preferredDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Pick a valid date")
    .refine((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(value) >= today;
    }, "Preferred date can't be in the past"),
  preferredTime: z.enum(timeWindowValues, "Select a time window"),
  notes: z.string().trim().max(1000).optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
