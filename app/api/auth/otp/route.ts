import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateOTP } from "@/lib/auth";
import { cacheOTP } from "@/lib/redis";
import { sendOTP } from "@/lib/sms";

const schema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian phone number (format: +91XXXXXXXXXX)"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);

    const otp = generateOTP();
    await cacheOTP(phone, otp);
    await sendOTP(phone, otp);

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
