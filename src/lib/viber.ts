import "server-only";

import { ISSUE_TYPE_LABELS, TIME_WINDOW_LABELS, formatPhp } from "@/lib/constants";
import type { IssueType, TimeWindow } from "@/types/database";

const VIBER_SEND_MESSAGE_URL = "https://chatapi.viber.com/pa/send_message";

export interface NewBookingMessageParams {
  referenceNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deviceInfo: string;
  issueType: IssueType;
  issueDetails?: string | null;
  preferredDate: string;
  preferredTime: TimeWindow;
  amount: number;
}

/** Spec.md §4.2 — customer name, phone, address, device/issue, preferred time, reference number. */
export function formatNewBookingMessage(params: NewBookingMessageParams): string {
  return [
    "🔧 New Home Service Booking",
    `Ref: ${params.referenceNumber}`,
    `Customer: ${params.customerName}`,
    `Phone: ${params.customerPhone}`,
    `Address: ${params.customerAddress}`,
    `Device: ${params.deviceInfo}`,
    `Issue: ${ISSUE_TYPE_LABELS[params.issueType]}${params.issueDetails ? ` — ${params.issueDetails}` : ""}`,
    `Preferred: ${params.preferredDate} · ${TIME_WINDOW_LABELS[params.preferredTime]}`,
    `Est. Amount: ${formatPhp(params.amount)}`,
  ].join("\n");
}

/**
 * Posts a one-way text message to the shop's Viber group/channel via the
 * Viber REST Bot API (Spec.md §7 — requires a verified Viber Public
 * Account, an account/setup dependency, not a code one). No-ops if the
 * env vars aren't configured yet, and never throws — a notification
 * failure shouldn't block booking creation.
 */
export async function sendViberGroupMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const authToken = process.env.VIBER_AUTH_TOKEN;
  const groupId = process.env.VIBER_GROUP_ID;

  if (!authToken || !groupId) {
    console.warn("[viber] VIBER_AUTH_TOKEN or VIBER_GROUP_ID not configured; skipping notification.");
    return { ok: false, error: "not_configured" };
  }

  try {
    const response = await fetch(VIBER_SEND_MESSAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Viber-Auth-Token": authToken,
      },
      body: JSON.stringify({
        receiver: groupId,
        type: "text",
        text,
        sender: { name: "Ceejay Cellphone Repair" },
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload.status !== 0) {
      const error = payload?.status_message ?? `HTTP ${response.status}`;
      console.error("[viber] send_message failed:", error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error("[viber] send_message threw:", error);
    return { ok: false, error: "request_failed" };
  }
}
