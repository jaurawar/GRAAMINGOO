import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getFirstMonthFreeUntil } from "@/lib/village-partner";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  village: z.string().min(2).max(100),
  pinCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  district: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, village, pinCode, district, state } = parsed.data;

    // Check for duplicate phone
    const existing = await prisma.villagePartner.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "A village partner with this phone number is already registered." },
        { status: 409 }
      );
    }

    const now = new Date();
    const partner = await prisma.villagePartner.create({
      data: {
        name,
        phone,
        village,
        pinCode,
        district,
        state,
        joinedAt: now,
        firstMonthFreeUntil: getFirstMonthFreeUntil(now),
      },
    });

    return NextResponse.json(
      {
        success: true,
        partner: {
          id: partner.id,
          name: partner.name,
          village: partner.village,
          district: partner.district,
          firstMonthFreeUntil: partner.firstMonthFreeUntil,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[village-partner/register]", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
