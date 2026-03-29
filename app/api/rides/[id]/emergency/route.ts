import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmergencyFare } from "@/lib/pricing";
import { sendEmergencyAlert } from "@/lib/sms";
import { VehicleType } from "@prisma/client";

/**
 * Convert an existing REQUESTED ride to EMERGENCY mode.
 * Fare is immediately locked. Family witness and PHC are alerted.
 * This is the platform's moral core — no gouging during crises.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ride = await prisma.ride.findUnique({
    where: { id: (await params).id },
    include: { passenger: true },
  });

  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  if (ride.passengerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ef = getEmergencyFare(ride.vehicleType as VehicleType, ride.distanceKm);

  const updated = await prisma.ride.update({
    where: { id: (await params).id },
    data: {
      isEmergency: true,
      rideType: "EMERGENCY",
      emergencyFee: ef.emergencyFee,
      systemFare: ef.systemFare,
      driverQuotedFare: ef.totalFare,
      finalFare: ef.totalFare,
      status: "REQUESTED", // still looking for driver, but fare is locked
    },
  });

  // Alert family witness
  const user = ride.passenger;
  if (user.familyWitnessPhone) {
    await sendEmergencyAlert({
      witnessPhone: user.familyWitnessPhone,
      passengerName: user.name,
      driverName: "Not yet assigned",
      vehicleNumber: "Not yet assigned",
      pickup: ride.pickupAddress,
      destination: ride.dropAddress,
      rideId: ride.id,
    }).catch(console.error);

    await prisma.familyAlert.create({
      data: {
        rideId: ride.id,
        passengerId: ride.passengerId,
        witnessPhone: user.familyWitnessPhone,
        alertType: "EMERGENCY",
        delivered: true,
      },
    });
  }

  return NextResponse.json({
    ride: updated,
    lockedFare: ef.totalFare,
    message: "Emergency mode activated. Fare locked. Family and health center alerted.",
  });
}
