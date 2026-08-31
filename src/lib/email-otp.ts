import "server-only";

import crypto from "node:crypto";

// Stateless email OTP: the 6-digit code sent to the customer is never
// stored server-side. Instead each step hands the client a signed,
// self-contained token — a "challenge" token while a code is outstanding,
// then a "verified proof" token once it's confirmed — so there's no
// database table to add just for a short-lived verification step.

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const PROOF_EXPIRY_MS = 30 * 60 * 1000; // long enough to finish the booking form

function getSecret(): string {
  const secret = process.env.EMAIL_OTP_SECRET;
  if (!secret) throw new Error("EMAIL_OTP_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function hashCode(code: string, email: string): string {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex");
}

function encode(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decode<T>(encoded: string): T | null {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function pack(encoded: string): string {
  return `${encoded}.${sign(encoded)}`;
}

function unpack(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  return safeEqual(sign(encoded), signature) ? encoded : null;
}

interface ChallengePayload {
  email: string;
  codeHash: string;
  exp: number;
}

export interface OtpChallenge {
  code: string;
  token: string;
}

/** Generates a 6-digit code and a signed challenge token proving it was issued for this email. */
export function createOtpChallenge(email: string): OtpChallenge {
  const code = crypto.randomInt(100000, 1000000).toString();
  const payload: ChallengePayload = {
    email,
    codeHash: hashCode(code, email),
    exp: Date.now() + OTP_EXPIRY_MS,
  };
  return { code, token: pack(encode(payload)) };
}

/** Checks a submitted code against its challenge token for the same email, unexpired. */
export function verifyOtpChallenge(token: string, email: string, code: string): boolean {
  const encoded = unpack(token);
  if (!encoded) return false;

  const payload = decode<ChallengePayload>(encoded);
  if (!payload) return false;
  if (payload.email !== email) return false;
  if (Date.now() > payload.exp) return false;

  return safeEqual(payload.codeHash, hashCode(code, email));
}

interface ProofPayload {
  email: string;
  exp: number;
}

/** Issued once a code is verified; the booking API re-checks this before accepting the booking. */
export function createVerifiedProof(email: string): string {
  const payload: ProofPayload = { email, exp: Date.now() + PROOF_EXPIRY_MS };
  return pack(encode(payload));
}

export function verifyProof(token: string, email: string): boolean {
  const encoded = unpack(token);
  if (!encoded) return false;

  const payload = decode<ProofPayload>(encoded);
  if (!payload) return false;
  if (payload.email !== email) return false;

  return Date.now() <= payload.exp;
}
