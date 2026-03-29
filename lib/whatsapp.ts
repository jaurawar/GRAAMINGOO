import { getWASession, setWASession, clearWASession } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { getFareEstimate, formatFare } from "@/lib/pricing";
import { VehicleType } from "@prisma/client";

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

// ─── Send a WhatsApp message ─────────────────────────────────────────────────

export async function sendWAMessage(to: string, text: string): Promise<void> {
  const res = await fetch(WA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WhatsApp API error ${res.status}: ${body}`);
  }
}

// ─── Conversation state machine ─────────────────────────────────────────────

type BookingStep =
  | "IDLE"
  | "ASK_RIDE_TYPE"
  | "ASK_PICKUP"
  | "ASK_DESTINATION"
  | "ASK_VEHICLE"
  | "CONFIRM"
  | "BOOKED";

interface WASession {
  step: BookingStep;
  rideType?: string;
  pickup?: string;
  destination?: string;
  vehicleType?: VehicleType;
  fareEstimate?: number;
}

const VEHICLE_OPTIONS = {
  "1": "BIKE" as VehicleType,
  "2": "AUTO" as VehicleType,
  "3": "SUV" as VehicleType,
  "4": "TEMPO" as VehicleType,
};

const VEHICLE_LABELS = {
  BIKE: "Bike (₹8/km)",
  AUTO: "Auto (₹12/km)",
  SUV: "SUV (₹16/km)",
  TEMPO: "Tempo/Cargo (₹20/km)",
};

// ─── Main message handler ────────────────────────────────────────────────────

export async function handleIncomingWAMessage(
  fromPhone: string,
  messageText: string
): Promise<void> {
  const text = messageText.trim().toLowerCase();
  const session = (await getWASession(fromPhone)) as WASession | null;
  const step = session?.step ?? "IDLE";

  // Reset keywords
  if (["cancel", "reset", "stop", "रुको", "नहीं"].includes(text)) {
    await clearWASession(fromPhone);
    await sendWAMessage(fromPhone,
      "Booking cancelled. Type *book* to start a new ride, or *emergency* for an emergency ride."
    );
    return;
  }

  // ── IDLE / Greeting ──────────────────────────────────────────────────────
  if (step === "IDLE") {
    if (["book", "ride", "hello", "hi", "नमस्ते", "बुक"].includes(text)) {
      await setWASession(fromPhone, { step: "ASK_RIDE_TYPE" });
      await sendWAMessage(fromPhone,
        "[Graamin Go]\n\nWhat kind of ride?\n\n" +
        "1️⃣ Normal ride\n" +
        "2️⃣ Emergency ride (hospital/urgent)\n" +
        "3️⃣ Wedding transport\n" +
        "4️⃣ Cargo / Kisan Haul\n\n" +
        "Reply with 1, 2, 3, or 4"
      );
    } else if (["emergency", "urgent", "hospital", "अस्पताल"].includes(text)) {
      await setWASession(fromPhone, { step: "ASK_PICKUP", rideType: "EMERGENCY" });
      await sendWAMessage(fromPhone,
        "[EMERGENCY]\n\nFare is locked at system rate + ₹100 flat fee. No negotiation.\n\n" +
        "Please share your *pickup location* (village name or address):"
      );
    } else {
      await sendWAMessage(fromPhone,
        "Welcome to *Graamin Go*\n\n" +
        "Type *book* to book a ride\n" +
        "Type *emergency* for an emergency ride\n" +
        "Type *status* to check your ride"
      );
    }
    return;
  }

  // ── ASK_RIDE_TYPE ────────────────────────────────────────────────────────
  if (step === "ASK_RIDE_TYPE") {
    const typeMap: Record<string, string> = {
      "1": "STANDARD", "2": "EMERGENCY", "3": "WEDDING", "4": "CARGO",
    };
    const rideType = typeMap[text];
    if (!rideType) {
      await sendWAMessage(fromPhone, "Please reply with 1, 2, 3, or 4.");
      return;
    }
    await setWASession(fromPhone, { ...session, step: "ASK_PICKUP", rideType });

    const prefix = rideType === "EMERGENCY"
      ? "[EMERGENCY] Emergency ride — fare locked at system rate + ₹100.\n\n"
      : "";
    await sendWAMessage(fromPhone,
      `${prefix}Please share your *pickup location* (village name or address):`
    );
    return;
  }

  // ── ASK_PICKUP ───────────────────────────────────────────────────────────
  if (step === "ASK_PICKUP") {
    await setWASession(fromPhone, { ...session, step: "ASK_DESTINATION", pickup: messageText.trim() });
    await sendWAMessage(fromPhone, "Where do you want to go? (destination):");
    return;
  }

  // ── ASK_DESTINATION ──────────────────────────────────────────────────────
  if (step === "ASK_DESTINATION") {
    await setWASession(fromPhone, { ...session, step: "ASK_VEHICLE", destination: messageText.trim() });
    await sendWAMessage(fromPhone,
      "Choose vehicle type:\n\n" +
      "1️⃣ Bike (₹8/km)\n" +
      "2️⃣ Auto (₹12/km)\n" +
      "3️⃣ SUV (₹16/km)\n" +
      "4️⃣ Tempo / Cargo (₹20/km)"
    );
    return;
  }

  // ── ASK_VEHICLE ──────────────────────────────────────────────────────────
  if (step === "ASK_VEHICLE") {
    const vehicleType = VEHICLE_OPTIONS[text as keyof typeof VEHICLE_OPTIONS];
    if (!vehicleType) {
      await sendWAMessage(fromPhone, "Please reply with 1, 2, 3, or 4.");
      return;
    }

    // Estimate fare (approximate 10km — real calculation happens on booking)
    const estimate = getFareEstimate(vehicleType, 10);
    const updatedSession = { ...session, step: "CONFIRM" as BookingStep, vehicleType, fareEstimate: estimate.systemFare };
    await setWASession(fromPhone, updatedSession);

    await sendWAMessage(fromPhone,
      `*Booking Summary*\n\n` +
      `From: ${session?.pickup}\n` +
      `To: ${session?.destination}\n` +
      `Vehicle: ${VEHICLE_LABELS[vehicleType]}\n` +
      `Estimated fare: ~${formatFare(estimate.systemFare)} (for 10km)\n` +
      `   Driver may quote ±15% of system fare.\n\n` +
      (session?.rideType === "EMERGENCY" ? "[EMERGENCY] Emergency fare: locked at system rate + ₹100\n\n" : "") +
      "Reply *confirm* to book or *cancel* to cancel."
    );
    return;
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────
  if (step === "CONFIRM") {
    if (!["confirm", "yes", "ok", "हाँ"].includes(text)) {
      await sendWAMessage(fromPhone, "Reply *confirm* to book or *cancel* to cancel.");
      return;
    }

    // Find user by phone
    const user = await prisma.user.findUnique({ where: { phone: fromPhone } });
    if (!user) {
      await clearWASession(fromPhone);
      await sendWAMessage(fromPhone,
        "You're not registered. Please download the Graamin Go app to register first."
      );
      return;
    }

    // Create a ride request (with approximate coords — user must confirm in app)
    const ride = await prisma.ride.create({
      data: {
        passengerId: user.id,
        rideType: (session?.rideType ?? "STANDARD") as never,
        vehicleType: (session?.vehicleType ?? "AUTO") as never,
        pickupLat: 0, pickupLng: 0,
        pickupAddress: session?.pickup ?? "",
        dropLat: 0, dropLng: 0,
        dropAddress: session?.destination ?? "",
        distanceKm: 0, // will be updated when driver accepts
        systemFare: session?.fareEstimate ?? 0,
        isEmergency: session?.rideType === "EMERGENCY",
        emergencyFee: session?.rideType === "EMERGENCY" ? 100 : null,
      },
    });

    await clearWASession(fromPhone);
    await sendWAMessage(fromPhone,
      `Ride request submitted.\n\n` +
      `Ride ID: *${ride.id.slice(-6).toUpperCase()}*\n` +
      `We're finding a driver near you.\n\n` +
      `You'll receive an SMS when a driver accepts your ride.\n` +
      `Type *status* to check your ride status.`
    );
    return;
  }

  // ── STATUS check ─────────────────────────────────────────────────────────
  if (["status", "where", "कहाँ"].includes(text)) {
    const user = await prisma.user.findUnique({ where: { phone: fromPhone } });
    if (!user) {
      await sendWAMessage(fromPhone, "No account found. Please register on the Graamin Go app.");
      return;
    }
    const latestRide = await prisma.ride.findFirst({
      where: { passengerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { driver: { include: { user: { select: { name: true, phone: true } } } } },
    });
    if (!latestRide) {
      await sendWAMessage(fromPhone, "No rides found. Type *book* to book a ride.");
      return;
    }
    const statusMessages: Record<string, string> = {
      REQUESTED: "⏳ Looking for a driver...",
      NEGOTIATING: "Driver is negotiating fare",
      ACCEPTED: `Driver ${latestRide.driver?.user.name} accepted your ride`,
      STARTED: "Ride in progress",
      COMPLETED: "Ride completed",
      CANCELLED: "Ride cancelled",
    };
    await sendWAMessage(fromPhone,
      `Ride ${latestRide.id.slice(-6).toUpperCase()}: ${statusMessages[latestRide.status] ?? latestRide.status}`
    );
    return;
  }

  // ── Default ───────────────────────────────────────────────────────────────
  await sendWAMessage(fromPhone,
    "Type *book* to book a ride, *emergency* for emergency, or *status* to check your ride."
  );
}
