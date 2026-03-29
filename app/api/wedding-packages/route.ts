import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(5),
  durationDays: z.number().int().min(1).max(30),
  totalRidesIncluded: z.number().int().min(1),
  quotedPrice: z.number().positive(),
  eventVillage: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver profile required" }, { status: 404 });

  const body = createSchema.parse(await req.json());
  const pkg = await prisma.weddingPackage.create({
    data: { ...body, driverId: driver.id },
  });
  return NextResponse.json(pkg, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const villageId = searchParams.get("village_id");

  const packages = await prisma.weddingPackage.findMany({
    where: {
      status: "AVAILABLE",
      ...(villageId && { eventVillage: { contains: villageId } }),
    },
    include: {
      driver: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(packages);
}
