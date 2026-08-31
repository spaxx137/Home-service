import { NextResponse, after } from "next/server";
import { z } from "zod";

import { ISSUE_TYPE_ESTIMATES, ISSUE_TYPE_LABELS, generateReferenceNumber } from "@/lib/constants";
import { verifyProof } from "@/lib/email-otp";
import { createCheckoutSession } from "@/lib/paymongo";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  bookingFormSchema,
  normalizePhMobile,
} from "@/lib/validation/booking";
import { formatNewBookingMessage, sendViberGroupMessage } from "@/lib/viber";

const BOOKING_PHOTOS_BUCKET = "booking-photos";
const MAX_REFERENCE_ATTEMPTS = 5;

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Logs the real error server-side and returns a safe, generic message to the client. */
function dbErrorResponse(context: string, error: unknown) {
  console.error(`[api/bookings] ${context}:`, error);
  return NextResponse.json(
    {
      error: "database_error",
      message: "Something went wrong on our end. Please try again in a moment.",
    },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = bookingFormSchema.safeParse({
    fullName: readField(formData, "fullName"),
    mobileNumber: readField(formData, "mobileNumber"),
    email: readField(formData, "email"),
    emailProof: readField(formData, "emailProof"),
    address: readField(formData, "address"),
    deviceInfo: readField(formData, "deviceInfo"),
    issueType: readField(formData, "issueType"),
    issueDetails: readField(formData, "issueDetails"),
    preferredDate: readField(formData, "preferredDate"),
    preferredTime: readField(formData, "preferredTime"),
    notes: readField(formData, "notes"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const values = parsed.data;

  // Never trust the client's "email is verified" state alone — re-check the
  // proof token server-side. It's only ever issued by /api/email-otp/verify
  // after a real code match, so this can't be bypassed by skipping the UI.
  if (!verifyProof(values.emailProof, values.email.trim().toLowerCase())) {
    return NextResponse.json(
      {
        error: "email_not_verified",
        message: "Please verify your email before submitting.",
      },
      { status: 400 },
    );
  }

  const photo = formData.get("photo");

  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: "invalid_photo", message: "Photo must be a JPEG, PNG, WEBP, or HEIC image." },
        { status: 400 },
      );
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: "invalid_photo", message: "Photo must be smaller than 5MB." },
        { status: 400 },
      );
    }
  }

  const supabase = createAdminClient();
  const mobileNumber = normalizePhMobile(values.mobileNumber);

  const { data: existingCustomer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", mobileNumber)
    .maybeSingle();

  if (lookupError) {
    return dbErrorResponse("customer lookup failed", lookupError);
  }

  let customerId = existingCustomer?.id;

  if (customerId) {
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        name: values.fullName,
        email: values.email,
        address: values.address,
      })
      .eq("id", customerId);

    if (updateError) {
      return dbErrorResponse("customer update failed", updateError);
    }
  } else {
    const { data: newCustomer, error: insertError } = await supabase
      .from("customers")
      .insert({
        name: values.fullName,
        phone: mobileNumber,
        email: values.email,
        address: values.address,
      })
      .select("id")
      .single();

    if (insertError || !newCustomer) {
      return dbErrorResponse("customer insert failed", insertError);
    }
    customerId = newCustomer.id;
  }

  if (!customerId) {
    return dbErrorResponse("customer id missing after upsert", new Error("no customer id"));
  }

  let photoUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    const extension = photo.name.split(".").pop() ?? "jpg";
    const objectPath = `${customerId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BOOKING_PHOTOS_BUCKET)
      .upload(objectPath, await photo.arrayBuffer(), {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      return dbErrorResponse("photo upload failed", uploadError);
    }

    const { data: publicUrl } = supabase.storage.from(BOOKING_PHOTOS_BUCKET).getPublicUrl(objectPath);
    photoUrl = publicUrl.publicUrl;
  }

  const amount = ISSUE_TYPE_ESTIMATES[values.issueType];

  let booking: { id: string; reference_number: string } | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS && !booking; attempt += 1) {
    const referenceNumber = generateReferenceNumber();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        reference_number: referenceNumber,
        customer_id: customerId,
        device_info: values.deviceInfo,
        issue_type: values.issueType,
        issue_details: values.issueDetails || null,
        notes: values.notes || null,
        photo_url: photoUrl,
        preferred_date: values.preferredDate,
        preferred_time: values.preferredTime,
        status: "new",
        payment_status: "unpaid",
        amount,
        technician_id: null,
      })
      .select("id, reference_number")
      .single();

    if (!error && data) {
      booking = data;
      break;
    }

    lastError = error;
    // Unique violation on reference_number — retry with a new one.
    if (error?.code !== "23505") break;
  }

  if (!booking) {
    return dbErrorResponse("booking insert failed", lastError);
  }

  // Runs after the response is sent (via next/server's `after`) so a slow
  // or failing Viber call can't delay or fail the booking response itself.
  // Errors are logged inside sendViberGroupMessage.
  after(() =>
    sendViberGroupMessage(
      formatNewBookingMessage({
        referenceNumber: booking.reference_number,
        customerName: values.fullName,
        customerPhone: mobileNumber,
        customerAddress: values.address,
        deviceInfo: values.deviceInfo,
        issueType: values.issueType,
        issueDetails: values.issueDetails,
        preferredDate: values.preferredDate,
        preferredTime: values.preferredTime,
        amount,
      }),
    ),
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const checkoutSession = await createCheckoutSession({
    referenceNumber: booking.reference_number,
    description: `${ISSUE_TYPE_LABELS[values.issueType]} — ${values.deviceInfo}`,
    amount,
    customerName: values.fullName,
    customerEmail: values.email,
    customerPhone: mobileNumber,
    successUrl: `${siteUrl}/book/payment-result?ref=${booking.reference_number}&status=success`,
    cancelUrl: `${siteUrl}/book/payment-result?ref=${booking.reference_number}&status=cancelled`,
  });

  if (checkoutSession) {
    const { error: paymentInsertError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      checkout_session_id: checkoutSession.sessionId,
      amount,
      status: "pending",
    });
    if (paymentInsertError) {
      console.error("[api/bookings] payment row insert failed:", paymentInsertError);
    }
  }

  return NextResponse.json({
    referenceNumber: booking.reference_number,
    amount,
    issueType: values.issueType,
    preferredDate: values.preferredDate,
    preferredTime: values.preferredTime,
    checkoutUrl: checkoutSession?.checkoutUrl ?? null,
  });
}
