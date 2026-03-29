import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  rideId: z.string(),
  rateeId: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await req.json());

  // Verify ride exists and rater was a participant
  const ride = await prisma.ride.findUnique({
    where: { id: body.rideId },
    include: { driver: true },
  });
  if (!ride) return NextResponse.json({ error: "Ride not found" }, { status: 404 });

  const isPassenger = ride.passengerId === session.user.id;
  const isDriver = ride.driver?.userId === session.user.id;
  if (!isPassenger && !isDriver) {
    return NextResponse.json({ error: "You were not part of this ride" }, { status: 403 });
  }

  const rating = await prisma.rating.create({
    data: {
      rideId: body.rideId,
      raterId: session.user.id,
      rateeId: body.rateeId,
      score: body.score,
      comment: body.comment,
    },
  });

  // Update village trust score for driver
  if (isPassenger && ride.driver) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.villageId) {
      const trust = await prisma.villageDriverTrust.findUnique({
        where: { driverId_villageId: { driverId: ride.driver.id, villageId: user.villageId } },
      });

      if (trust) {
        const newAvg = (trust.avgScore * trust.totalRidesInVillage + body.score) / (trust.totalRidesInVillage + 1);
        await prisma.villageDriverTrust.update({
          where: { driverId_villageId: { driverId: ride.driver.id, villageId: user.villageId } },
          data: { avgScore: newAvg, totalRidesInVillage: { increment: 1 } },
        });
      } else {
        await prisma.villageDriverTrust.create({
          data: {
            driverId: ride.driver.id,
            villageId: user.villageId,
            avgScore: body.score,
            totalRidesInVillage: 1,
          },
        });
      }
    }

    // After a ride, mark driver as known
    await prisma.knownDriver.upsert({
      where: { passengerId_driverId: { passengerId: session.user.id, driverId: ride.driver.id } },
      update: { trustLevel: body.score >= 4 ? "TRUSTED" : "FAMILIAR" },
      create: { passengerId: session.user.id, driverId: ride.driver.id, trustLevel: body.score >= 4 ? "TRUSTED" : "FAMILIAR" },
    });
  }

  return NextResponse.json(rating, { status: 201 });
}
