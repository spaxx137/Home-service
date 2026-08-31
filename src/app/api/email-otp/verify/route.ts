import { NextResponse } from "next/server";
import { z } from "zod";

import { createVerifiedProof, verifyOtpChallenge } from "@/lib/email-otp";

const bodySchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", message: "Enter the 6-digit code." },
      { status: 400 },
    );
  }

  const { email, code, token } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    if (!verifyOtpChallenge(token, normalizedEmail, code)) {
      return NextResponse.json(
        { error: "invalid_code", message: "That code is incorrect or has expired." },
        { status: 400 },
      );
    }

    const proof = createVerifiedProof(normalizedEmail);
    return NextResponse.json({ proof });
  } catch (error) {
    console.error("[api/email-otp/verify] EMAIL_OTP_SECRET not configured:", error);
    return NextResponse.json(
      { error: "not_configured", message: "Email verification isn't set up yet. Please try again later." },
      { status: 500 },
    );
  }
}
