import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  rideId: z.string(),
  cargoType: z.enum(["PRODUCE", "GOODS", "EQUIPMENT"]),
  weightKg: z.number().positive().optional(),
  mandiName: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await req.json());

  const cargo = await prisma.cargoBooking.create({ data: body });
  return NextResponse.json(cargo, { status: 201 });
}
