import { NextRequest, NextResponse } from "next/server";
import { getFareEstimate, getEmergencyFare } from "@/lib/pricing";
import { VehicleType } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  vehicle_type: z.enum(["BIKE", "AUTO", "SUV", "TEMPO"]),
  distance: z.coerce.number().positive().max(500),
  emergency: z.coerce.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = querySchema.parse({
      vehicle_type: searchParams.get("vehicle_type"),
      distance: searchParams.get("distance"),
      emergency: searchParams.get("emergency"),
    });

    const vehicleType = params.vehicle_type as VehicleType;

    if (params.emergency) {
      const ef = getEmergencyFare(vehicleType, params.distance);
      return NextResponse.json({ ...ef, isEmergency: true });
    }

    const estimate = getFareEstimate(vehicleType, params.distance);
    return NextResponse.json(estimate);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
