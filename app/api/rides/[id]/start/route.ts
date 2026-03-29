import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTripStartAlert } from "@/lib/sms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const driver = await prisma.driver.findUnique({ where: { userId: session.user.id } });
  if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 });

  const ride = await prisma.ride.findUnique({
    where: { id: (await params).id },
    include: {
      passenger: { select: { name: true, familyWitnessPhone: true } },
    },
  });

  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  if (ride.driverId !== driver.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ride.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Ride must be accepted before starting" }, { status: 400 });
  }

  const updated = await prisma.ride.update({
    where: { id: (await params).id },
    data: { status: "STARTED", startedAt: new Date() },
  });

  // Send family witness alert
  if (ride.passenger.familyWitnessPhone) {
    await sendTripStartAlert({
      witnessPhone: ride.passenger.familyWitnessPhone,
      passengerName: ride.passenger.name,
      driverName: session.user.name ?? "Driver",
      vehicleNumber: driver.vehicleNumber,
      pickup: ride.pickupAddress,
      destination: ride.dropAddress,
      rideId: ride.id,
    }).catch(console.error);

    await prisma.familyAlert.create({
      data: {
        rideId: ride.id,
        passengerId: ride.passengerId,
        witnessPhone: ride.passenger.familyWitnessPhone,
        alertType: "TRIP_START",
        delivered: true,
      },
    });
  }

  return NextResponse.json(updated);
}
