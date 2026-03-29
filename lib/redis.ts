import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WA_SESSION_TTL = 60 * 30; // 30 minutes

// ─── WhatsApp session (fix: parse JSON on get) ────────────────────────────────

export async function getWASession(phone: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(`wa:session:${phone}`);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function setWASession(
  phone: string,
  data: Record<string, unknown>
): Promise<void> {
  await redis.setex(`wa:session:${phone}`, WA_SESSION_TTL, JSON.stringify(data));
}

export async function clearWASession(phone: string): Promise<void> {
  await redis.del(`wa:session:${phone}`);
}

// ─── OTP (short-lived) ────────────────────────────────────────────────────────

export async function cacheOTP(phone: string, code: string): Promise<void> {
  await redis.setex(`otp:${phone}`, 600, code);
}

export async function getOTP(phone: string): Promise<string | null> {
  return redis.get<string>(`otp:${phone}`);
}

export async function deleteOTP(phone: string): Promise<void> {
  await redis.del(`otp:${phone}`);
}
