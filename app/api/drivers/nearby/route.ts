import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findNearbyDrivers } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

const querySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  vehicle_type: z.enum(["BIKE", "AUTO", "SUV", "TEMPO"]).optional(),
  radius_km: z.coerce.number().optional().default(5),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = querySchema.parse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    vehicle_type: searchParams.get("vehicle_type"),
    radius_km: searchParams.get("radius_km"),
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const drivers = await findNearbyDrivers({
    pickupLat: params.lat,
    pickupLng: params.lng,
    vehicleType: params.vehicle_type as VehicleType | undefined,
    passengerId: session.user.id,
    villageId: user?.villageId ?? undefined,
    radiusKm: params.radius_km,
  });

  return NextResponse.json(drivers);
}
