import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findReturnTripMatch } from "@/lib/matching";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const ride = await prisma.ride.findUnique({ where: { id: (await params).id } });
  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  if (ride.driverId !== driver.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ride.status !== "COMPLETED") {
    return NextResponse.json({ error: "Ride must be completed to find return matches" }, { status: 400 });
  }

  const matches = await findReturnTripMatch({
    driverLat: ride.dropLat,
    driverLng: ride.dropLng,
    originalPickupLat: ride.pickupLat,
    originalPickupLng: ride.pickupLng,
    vehicleType: driver.vehicleType,
  });

  return NextResponse.json({
    matches,
    commissionNote: "Return trip rides earn 3% commission instead of the standard rate",
  });
}
