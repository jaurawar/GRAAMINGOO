import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFareEstimate, getEmergencyFare, isQuoteWithinBand } from "@/lib/pricing";
import { findNearbyDrivers } from "@/lib/matching";
import { calculateCommission } from "@/lib/commission";
import { sendTripStartAlert, sendTripEndAlert, sendEmergencyAlert } from "@/lib/sms";
import { z } from "zod";
import { VehicleType, RideType } from "@prisma/client";

// ─── Create a ride request ───────────────────────────────────────────────────

const createSchema = z.object({
  vehicleType: z.enum(["BIKE", "AUTO", "SUV", "TEMPO"]),
  rideType: z.enum(["STANDARD", "EMERGENCY", "CARGO", "WEDDING"]).default("STANDARD"),
  pickupLat: z.number(),
  pickupLng: z.number(),
  pickupAddress: z.string().min(1),
  dropLat: z.number(),
  dropLng: z.number(),
  dropAddress: z.string().min(1),
  distanceKm: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const isEmergency = body.rideType === "EMERGENCY";

    const vehicleType = body.vehicleType as VehicleType;

    // Calculate fares
    let systemFare: number;
    let emergencyFee: number | null = null;

    if (isEmergency) {
      const ef = getEmergencyFare(vehicleType, body.distanceKm);
      systemFare = ef.systemFare;
      emergencyFee = ef.emergencyFee;
    } else {
      const estimate = getFareEstimate(vehicleType, body.distanceKm);
      systemFare = estimate.systemFare;
    }

    const ride = await prisma.ride.create({
      data: {
        passengerId: session.user.id,
        vehicleType,
        rideType: body.rideType as RideType,
        pickupLat: body.pickupLat,
        pickupLng: body.pickupLng,
        pickupAddress: body.pickupAddress,
        dropLat: body.dropLat,
        dropLng: body.dropLng,
        dropAddress: body.dropAddress,
        distanceKm: body.distanceKm,
        systemFare,
        isEmergency,
        emergencyFee,
        // Emergency rides: driver quoted fare = locked total (no negotiation)
        driverQuotedFare: isEmergency ? systemFare + (emergencyFee ?? 0) : undefined,
        status: isEmergency ? "ACCEPTED" : "REQUESTED",
      },
    });

    // For emergency rides, send family witness alert immediately
    if (isEmergency) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.familyWitnessPhone) {
        await sendEmergencyAlert({
          witnessPhone: user.familyWitnessPhone,
          passengerName: user.name,
          driverName: "TBD",
          vehicleNumber: "TBD",
          pickup: body.pickupAddress,
          destination: body.dropAddress,
          rideId: ride.id,
        }).catch(console.error);
      }
    }

    return NextResponse.json(ride, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("Create ride error:", err);
    return NextResponse.json({ error: "Failed to create ride" }, { status: 500 });
  }
}

// ─── Get passenger's rides ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where: { passengerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        driver: {
          include: { user: { select: { name: true, phone: true } } },
        },
      },
    }),
    prisma.ride.count({ where: { passengerId: session.user.id } }),
  ]);

  return NextResponse.json({ rides, total, page, pages: Math.ceil(total / limit) });
}
