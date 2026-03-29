import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/commission";
import { sendTripEndAlert } from "@/lib/sms";

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
  if (ride.status !== "STARTED") {
    return NextResponse.json({ error: "Ride must be started before completing" }, { status: 400 });
  }

  // Determine final fare
  const finalFare = ride.finalFare ?? ride.driverQuotedFare ?? ride.systemFare;

  // Calculate commission
  const commission = calculateCommission({
    finalFare,
    driverPlan: driver.plan,
    subscriptionExpiresAt: driver.subscriptionExpiresAt,
    ridesThisMonth: driver.ridesThisMonth,
    isReturnTrip: ride.isReturnTrip,
  });

  // Complete ride and update driver stats
  const [updated] = await prisma.$transaction([
    prisma.ride.update({
      where: { id: (await params).id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        finalFare,
        commissionRate: commission.rate,
        commissionAmount: commission.amount,
      },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: {
        totalRidesAllTime: { increment: 1 },
        ridesThisMonth: { increment: 1 },
      },
    }),
  ]);

  // Log in community trip log if driver opts in (default: log it)
  await prisma.communityTripLog.create({
    data: {
      rideId: ride.id,
      villageId: (await prisma.user.findUnique({
        where: { id: ride.passengerId },
        select: { villageId: true },
      }))?.villageId ?? "unknown",
      driverId: driver.id,
      isPublic: true,
      routeSummary: `${ride.pickupAddress} → ${ride.dropAddress}, ${ride.distanceKm}km`,
      vehicleType: ride.vehicleType,
    },
  }).catch(() => {}); // non-critical

  // Update village trust score
  if (ride.isReturnTrip) {
    // mark as known driver for passenger after return trip
  }

  // Send family witness end alert
  if (ride.passenger.familyWitnessPhone) {
    await sendTripEndAlert({
      witnessPhone: ride.passenger.familyWitnessPhone,
      passengerName: ride.passenger.name,
      destination: ride.dropAddress,
      rideId: ride.id,
    }).catch(console.error);
  }

  return NextResponse.json({ ...updated, commission });
}
