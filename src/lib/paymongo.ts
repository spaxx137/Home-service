import "server-only";

import crypto from "node:crypto";

const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

export interface CreateCheckoutSessionParams {
  referenceNumber: string;
  description: string;
  amount: number; // PHP, major units (e.g. 1500 = ₱1,500)
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

/**
 * Creates a PayMongo Checkout Session for GCash/Maya (Spec.md §7 — PayMongo
 * is the recommended PH gateway for GCash + Maya without integrating each
 * wallet directly). Returns null (rather than throwing) if the secret key
 * isn't configured or the request fails, so booking creation can degrade
 * gracefully instead of blocking on this external dependency.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSession | null> {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    console.warn("[paymongo] PAYMONGO_SECRET_KEY not configured; skipping checkout session.");
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  try {
    const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              name: params.customerName,
              email: params.customerEmail || undefined,
              phone: params.customerPhone,
            },
            send_email_receipt: false,
            show_line_items: true,
            line_items: [
              {
                currency: "PHP",
                amount: Math.round(params.amount * 100),
                name: params.description,
                quantity: 1,
              },
            ],
            payment_method_types: ["gcash", "paymaya"],
            description: params.description,
            reference_number: params.referenceNumber,
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      console.error("[paymongo] create checkout session failed:", payload);
      return null;
    }

    const sessionId: string | undefined = payload?.data?.id;
    const checkoutUrl: string | undefined = payload?.data?.attributes?.checkout_url;
    if (!sessionId || !checkoutUrl) {
      console.error("[paymongo] unexpected checkout session response shape:", payload);
      return null;
    }

    return { sessionId, checkoutUrl };
  } catch (error) {
    console.error("[paymongo] create checkout session threw:", error);
    return null;
  }
}

/**
 * Verifies a PayMongo webhook's `Paymongo-Signature` header, formatted as
 * `t=<timestamp>,te=<test_mode_signature>,li=<live_mode_signature>`. The
 * signed value is `${timestamp}.${rawBody}`, HMAC-SHA256 hex-encoded with
 * the webhook's secret key; live mode wins over test mode when both are
 * present (mirrors PayMongo's own official SDKs).
 */
export function verifyPaymongoSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): boolean {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = parts.t;
  const comparisonSignature = parts.li || parts.te;
  if (!timestamp || !comparisonSignature) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(comparisonSignature, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
