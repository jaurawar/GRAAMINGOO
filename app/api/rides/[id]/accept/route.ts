import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isQuoteWithinBand } from "@/lib/pricing";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

const schema = z.object({
  quotedFare: z.number().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ride = await prisma.ride.findUnique({ where: { id: (await params).id } });
  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  if (ride.status !== "REQUESTED") {
    return NextResponse.json({ error: "Ride is not available" }, { status: 400 });
  }

  // Find driver record for this user
  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver profile not found" }, { status: 404 });

  const body = schema.parse(await req.json());

  // For emergency rides, fare is locked — override any quote
  let quotedFare = body.quotedFare;
  if (ride.isEmergency) {
    quotedFare = ride.systemFare + (ride.emergencyFee ?? 100);
  } else {
    // Validate quote is within ±15% band
    const inBand = isQuoteWithinBand(body.quotedFare, ride.vehicleType as VehicleType, ride.distanceKm);
    if (!inBand) {
      return NextResponse.json(
        { error: "Quoted fare is outside the allowed ±15% band" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.ride.update({
    where: { id: (await params).id },
    data: {
      driverId: driver.id,
      driverQuotedFare: quotedFare,
      // Emergency: immediately accepted at locked fare
      status: ride.isEmergency ? "ACCEPTED" : "NEGOTIATING",
      finalFare: ride.isEmergency ? quotedFare : undefined,
    },
  });

  // Log negotiation round 1 (driver's initial offer)
  if (!ride.isEmergency) {
    await prisma.fareNegotiation.create({
      data: {
        rideId: (await params).id,
        round: 1,
        driverOffer: quotedFare,
      },
    });
  }

  return NextResponse.json(updated);
}
