import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends the booking form's email verification code via Resend. Returns
 * false (rather than throwing) if the API key isn't configured or the
 * request fails — callers must treat that as a hard failure, though: unlike
 * Viber/PayMongo, email verification is a required gate on booking
 * submission (per Spec.md decision), so there's no "skip and continue"
 * fallback here.
 */
export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !from) {
    console.error("[email] RESEND_API_KEY or EMAIL_FROM_ADDRESS not configured.");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Your Ceejay verification code: ${code}`,
        text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      }),
    });

    if (!response.ok) {
      console.error("[email] Resend send failed:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email] Resend send threw:", error);
    return false;
  }
}
