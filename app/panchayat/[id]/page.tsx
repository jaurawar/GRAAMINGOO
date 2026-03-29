import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Bike, Car, Truck, Star, CheckCircle } from "lucide-react";

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  BIKE: Bike, AUTO: Car, SUV: Car, TEMPO: Truck,
};

interface TripLogEntry {
  id: string;
  routeSummary: string;
  vehicleType: string;
  loggedAt: Date;
  driver: {
    user: { name: string };
    villageTrust: Array<{ avgScore: number; panchayatEndorsed: boolean }>;
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PanchayatPage({ params }: Props) {
  const { id } = await params;
  const panchayat = await prisma.panchayat.findUnique({
    where: { id },
    include: { villages: true },
  });

  if (!panchayat) notFound();

  const villageIds = panchayat.villages.map((v) => v.id);

  // Community trip log — public entries from this panchayat's villages
  const tripLogs = await prisma.communityTripLog.findMany({
    where: {
      villageId: { in: villageIds },
      isPublic: true,
    },
    orderBy: { loggedAt: "desc" },
    take: 50,
    include: {
      driver: {
        include: {
          user: { select: { name: true } },
          villageTrust: {
            where: { villageId: { in: villageIds } },
            take: 1,
          },
        },
      },
    },
  });

  // Trusted drivers in this panchayat area
  const trustedDrivers = await prisma.villageDriverTrust.findMany({
    where: {
      villageId: { in: villageIds },
      totalRidesInVillage: { gte: 5 },
    },
    orderBy: [{ panchayatEndorsed: "desc" }, { avgScore: "desc" }],
    take: 10,
    include: {
      driver: {
        include: { user: { select: { name: true, phone: true } } },
      },
    },
  });


  return (
    <main className="min-h-screen bg-brand-cream pb-10">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold">{panchayat.name}</h1>
        <p className="text-brand-green-pale text-sm mt-0.5">
          {panchayat.district} · {panchayat.state}
        </p>
        {panchayat.sarpanchName && (
          <p className="text-brand-green-pale text-xs mt-1">
            Sarpanch: {panchayat.sarpanchName}
          </p>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-md mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-brand-green">{panchayat.totalRidesLogged}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total Rides</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-brand-green">{trustedDrivers.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Trusted Drivers</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-brand-green">
              {panchayat.communityTrustScore.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Trust Score</p>
          </div>
        </div>

        {/* Trusted drivers */}
        {trustedDrivers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Panchayat-Trusted Drivers
            </p>
            <div className="space-y-2">
              {trustedDrivers.map((td) => (
                <div
                  key={td.id}
                  className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{td.driver.user.name}</p>
                      {td.panchayatEndorsed && (
                        <span className="text-xs bg-brand-green-pale text-brand-green px-1.5 py-0.5 rounded-full font-semibold">
                          <CheckCircle size={10} className="inline mr-0.5" />Endorsed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {td.totalRidesInVillage} rides in this area
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-green flex items-center gap-1">
                      <Star size={12} className="fill-saffron-400 text-saffron-400" />
                      {td.avgScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community trip log */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
            Community Trip Log
          </p>
          <p className="text-xs text-gray-400 mb-3 px-1">
            Public log of completed rides in this panchayat area. Builds community trust.
          </p>

          {tripLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">No public trips logged yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tripLogs.map((log) => {
                const trust = (log as unknown as TripLogEntry).driver.villageTrust?.[0];
                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {(() => { const Icon = VEHICLE_ICONS[log.vehicleType] ?? Car; return <Icon size={14} className="text-gray-400 shrink-0" />; })()}
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {log.routeSummary}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {(log as unknown as TripLogEntry).driver.user.name}
                          {trust?.panchayatEndorsed && (
                            <span className="ml-1 text-brand-green flex items-center gap-0.5 inline-flex">· <CheckCircle size={10} /> Endorsed</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.loggedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const p = await prisma.panchayat.findUnique({ where: { id } });
  return { title: p ? `${p.name} — Graamin Go` : "Panchayat — Graamin Go" };
}
