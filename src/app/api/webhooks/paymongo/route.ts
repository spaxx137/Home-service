import { NextResponse } from "next/server";

import { verifyPaymongoSignature } from "@/lib/paymongo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentProvider } from "@/types/database";

// PayMongo checkout-session-completion event. Field paths below follow
// PayMongo's standard {id, type, attributes} resource envelope, nested one
// level for the event wrapper — verify against a real webhook payload
// (PayMongo Dashboard > Developers > Webhooks > event log) once a live
// account is available, since this couldn't be confirmed end-to-end without
// one (Spec.md Open Question 2-adjacent: PayMongo account setup).
const HANDLED_EVENT_TYPE = "checkout_session.payment.paid";

function mapSourceTypeToProvider(sourceType: string | undefined): PaymentProvider | null {
  if (sourceType === "gcash") return "paymongo_gcash";
  if (sourceType === "paymaya") return "paymongo_maya";
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhooks/paymongo] PAYMONGO_WEBHOOK_SECRET not configured.");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paymongo-signature");

  if (!verifyPaymongoSignature(rawBody, signatureHeader, webhookSecret)) {
    console.error("[webhooks/paymongo] signature verification failed.");
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const eventType: string | undefined = payload?.data?.attributes?.type;

  if (eventType !== HANDLED_EVENT_TYPE) {
    // Ack anything we don't act on so PayMongo stops retrying it.
    return NextResponse.json({ received: true, handled: false });
  }

  const session = payload?.data?.attributes?.data;
  const sessionId: string | undefined = session?.id;
  const referenceNumber: string | undefined = session?.attributes?.reference_number;
  const payment = session?.attributes?.payments?.[0];
  const paymentId: string | undefined = payment?.id;
  const sourceType: string | undefined = payment?.attributes?.source?.type;

  if (!sessionId && !referenceNumber) {
    console.error("[webhooks/paymongo] payload missing both session id and reference number:", payload);
    return NextResponse.json({ received: true, handled: false });
  }

  const supabase = createAdminClient();

  let paymentRow: { id: string; booking_id: string } | null = null;

  if (sessionId) {
    const { data } = await supabase
      .from("payments")
      .select("id, booking_id")
      .eq("checkout_session_id", sessionId)
      .maybeSingle();
    paymentRow = data;
  }

  if (!paymentRow && referenceNumber) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("reference_number", referenceNumber)
      .maybeSingle();

    if (booking) {
      const { data } = await supabase
        .from("payments")
        .select("id, booking_id")
        .eq("booking_id", booking.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      paymentRow = data;
    }
  }

  if (!paymentRow) {
    console.error("[webhooks/paymongo] no matching payment row for session/reference:", {
      sessionId,
      referenceNumber,
    });
    return NextResponse.json({ received: true, handled: false });
  }

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      provider: mapSourceTypeToProvider(sourceType),
      provider_reference: paymentId ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentRow.id);

  if (paymentUpdateError) {
    console.error("[webhooks/paymongo] payment update failed:", paymentUpdateError);
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }

  const { error: bookingUpdateError } = await supabase
    .from("bookings")
    .update({ payment_status: "paid" })
    .eq("id", paymentRow.booking_id);

  if (bookingUpdateError) {
    console.error("[webhooks/paymongo] booking update failed:", bookingUpdateError);
    return NextResponse.json({ error: "database_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true, handled: true });
}
