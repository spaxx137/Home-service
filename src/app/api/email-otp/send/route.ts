import { NextResponse } from "next/server";
import { z } from "zod";

import { createOtpChallenge } from "@/lib/email-otp";
import { sendOtpEmail } from "@/lib/email";

const RESEND_COOLDOWN_MS = 30 * 1000;

// Best-effort, single-instance-only cooldown per email — enough to stop a
// casual double-click or an accidental refresh from spamming an inbox. It
// resets on server restart and doesn't hold across multiple serverless
// instances, so it's not a substitute for real rate limiting (e.g. an edge
// WAF rule or a Redis-backed limiter) before this goes to real production
// traffic.
const lastSentAt = new Map<string, number>();

const bodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", message: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const last = lastSentAt.get(email);
  if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "rate_limited", message: "Please wait a bit before requesting another code." },
      { status: 429 },
    );
  }

  let code: string;
  let token: string;
  try {
    ({ code, token } = createOtpChallenge(email));
  } catch (error) {
    console.error("[api/email-otp/send] EMAIL_OTP_SECRET not configured:", error);
    return NextResponse.json(
      { error: "not_configured", message: "Email verification isn't set up yet. Please try again later." },
      { status: 500 },
    );
  }

  const sent = await sendOtpEmail(email, code);

  if (!sent) {
    return NextResponse.json(
      {
        error: "send_failed",
        message: "Couldn't send a verification code right now. Please try again shortly.",
      },
      { status: 502 },
    );
  }

  lastSentAt.set(email, Date.now());
  return NextResponse.json({ token });
}
