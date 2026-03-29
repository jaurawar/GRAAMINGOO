import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isQuoteWithinBand } from "@/lib/pricing";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

const schema = z.object({
  counterOffer: z.number().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ride = await prisma.ride.findUnique({
    where: { id: (await params).id },
    include: { negotiations: { orderBy: { round: "desc" }, take: 1 } },
  });

  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  if (ride.status !== "NEGOTIATING") {
    return NextResponse.json({ error: "Ride is not in negotiation" }, { status: 400 });
  }
  if (ride.isEmergency) {
    return NextResponse.json({ error: "Emergency fares are locked — no negotiation" }, { status: 400 });
  }

  const currentNegotiation = ride.negotiations[0];
  if (!currentNegotiation) {
    return NextResponse.json({ error: "No active negotiation" }, { status: 400 });
  }

  const body = schema.parse(await req.json());
  const { counterOffer } = body;

  // Passenger's counter must still be within the band (can't go below min)
  const inBand = isQuoteWithinBand(counterOffer, ride.vehicleType as VehicleType, ride.distanceKm);
  if (!inBand) {
    return NextResponse.json(
      { error: "Counter offer is outside the ±15% band" },
      { status: 400 }
    );
  }

  // Max 3 negotiation rounds
  if (currentNegotiation.round >= 3) {
    // Auto-accept at system fare after 3 failed rounds
    await prisma.fareNegotiation.update({
      where: { id: currentNegotiation.id },
      data: { status: "EXPIRED", acceptedFare: ride.systemFare },
    });
    await prisma.ride.update({
      where: { id: (await params).id },
      data: { status: "ACCEPTED", finalFare: ride.systemFare },
    });
    return NextResponse.json({
      message: "3 rounds exceeded — fare defaulted to system suggested price",
      finalFare: ride.systemFare,
    });
  }

  // Accept if counter matches driver's offer
  if (counterOffer >= (currentNegotiation.driverOffer ?? 0)) {
    await prisma.fareNegotiation.update({
      where: { id: currentNegotiation.id },
      data: { passengerCounter: counterOffer, status: "ACCEPTED", acceptedFare: currentNegotiation.driverOffer },
    });
    const updated = await prisma.ride.update({
      where: { id: (await params).id },
      data: { status: "ACCEPTED", finalFare: currentNegotiation.driverOffer },
    });
    return NextResponse.json(updated);
  }

  // New negotiation round
  await prisma.fareNegotiation.update({
    where: { id: currentNegotiation.id },
    data: { passengerCounter: counterOffer },
  });

  // Create next round for driver
  await prisma.fareNegotiation.create({
    data: {
      rideId: (await params).id,
      round: currentNegotiation.round + 1,
      driverOffer: currentNegotiation.driverOffer, // driver can accept or revise
    },
  });

  return NextResponse.json({ round: currentNegotiation.round + 1, passengerCounter: counterOffer });
}
