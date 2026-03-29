import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPerformanceHealth, isInFreePeriod } from "@/lib/village-partner";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const partner = await prisma.villagePartner.findUnique({
      where: { id: partnerId },
      include: {
        registeredDrivers: {
          include: {
            rides: {
              where: { status: "COMPLETED" },
              select: { id: true, finalFare: true, commissionAmount: true, completedAt: true },
            },
            user: { select: { name: true, phone: true } },
          },
        },
        commissions: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Village partner not found" }, { status: 404 });
    }

    // Infer commission record type from the Prisma result
    type CommissionRecord = (typeof partner.commissions)[number];
    type DriverRecord = (typeof partner.registeredDrivers)[number];

    // Drivers registered by this partner
    const driversRegistered = partner.registeredDrivers.length;

    // Total completed rides across all registered drivers
    const totalRidesCompleted = partner.registeredDrivers.reduce(
      (sum: number, d: DriverRecord) => sum + d.rides.length,
      0
    );

    // Unique passengers (active villagers) across all those rides
    const uniquePassengerRides = await prisma.ride.findMany({
      where: {
        driverId: {
          in: partner.registeredDrivers.map((d: DriverRecord) => d.id),
        },
        status: "COMPLETED",
      },
      select: { passengerId: true },
    });
    const activeVillagers = new Set(uniquePassengerRides.map((r) => r.passengerId)).size;

    // Commission breakdown
    const totalCommissionEarned = partner.commissions.reduce(
      (sum: number, c: CommissionRecord) => sum + c.partnerShare,
      0
    );
    const settledCommission = partner.commissions
      .filter((c: CommissionRecord) => c.settled)
      .reduce((sum: number, c: CommissionRecord) => sum + c.partnerShare, 0);
    const pendingCommission = totalCommissionEarned - settledCommission;

    // Recent commissions (last 10)
    const recentCommissions = [...partner.commissions]
      .sort(
        (a: CommissionRecord, b: CommissionRecord) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10)
      .map((c: CommissionRecord) => ({
        rideId: c.rideId,
        platformCommission: c.platformCommission,
        partnerShare: c.partnerShare,
        settled: c.settled,
        createdAt: c.createdAt,
      }));

    const performanceHealth = getPerformanceHealth(totalRidesCompleted);
    const inFreePeriod = isInFreePeriod(partner.joinedAt);

    // Driver list summary
    const drivers = partner.registeredDrivers.map((d: DriverRecord) => ({
      id: d.id,
      name: d.user.name,
      phone: d.user.phone,
      vehicleType: d.vehicleType,
      isAvailable: d.isAvailable,
      totalRides: d.rides.length,
    }));

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        village: partner.village,
        district: partner.district,
        state: partner.state,
        joinedAt: partner.joinedAt,
        firstMonthFreeUntil: partner.firstMonthFreeUntil,
        inFreePeriod,
      },
      stats: {
        driversRegistered,
        activeVillagers,
        totalRidesCompleted,
        totalCommissionEarned,
        settledCommission,
        pendingCommission,
        performanceHealth,
      },
      drivers,
      recentCommissions,
    });
  } catch (err) {
    console.error("[village-partner/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard data." }, { status: 500 });
  }
}
