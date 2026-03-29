import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_PHONE_NUMBER!;

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function sendOTP(phone: string, otp: string): Promise<void> {
  await client.messages.create({
    to: phone,
    from: FROM,
    body: `${otp} is your Graamin Go OTP. Valid for 10 minutes. Do not share with anyone.`,
  });
}

// ─── Family Witness Alerts ────────────────────────────────────────────────────

export async function sendTripStartAlert(params: {
  witnessPhone: string;
  passengerName: string;
  driverName: string;
  vehicleNumber: string;
  pickup: string;
  destination: string;
  rideId: string;
}): Promise<void> {
  const { witnessPhone, passengerName, driverName, vehicleNumber, pickup, destination, rideId } = params;
  await client.messages.create({
    to: witnessPhone,
    from: FROM,
    body:
      `Graamin Go: ${passengerName} started a ride.\n` +
      `From: ${pickup}\nTo: ${destination}\n` +
      `Driver: ${driverName} | Vehicle: ${vehicleNumber}\n` +
      `Ride ID: ${rideId.slice(-6).toUpperCase()}`,
  });
}

export async function sendTripEndAlert(params: {
  witnessPhone: string;
  passengerName: string;
  destination: string;
  rideId: string;
}): Promise<void> {
  const { witnessPhone, passengerName, destination, rideId } = params;
  await client.messages.create({
    to: witnessPhone,
    from: FROM,
    body:
      `Graamin Go: ${passengerName} has safely reached ${destination}.\n` +
      `Ride ${rideId.slice(-6).toUpperCase()} completed.`,
  });
}

export async function sendEmergencyAlert(params: {
  witnessPhone: string;
  passengerName: string;
  driverName: string;
  vehicleNumber: string;
  pickup: string;
  destination: string;
  rideId: string;
}): Promise<void> {
  const { witnessPhone, passengerName, driverName, vehicleNumber, pickup, destination, rideId } = params;
  await client.messages.create({
    to: witnessPhone,
    from: FROM,
    body:
      `URGENT - Graamin Go Emergency Ride:\n` +
      `${passengerName} has booked an EMERGENCY ride.\n` +
      `From: ${pickup} → To: ${destination}\n` +
      `Driver: ${driverName} | ${vehicleNumber}\n` +
      `Ride ID: ${rideId.slice(-6).toUpperCase()}\n` +
      `This is an automated safety alert.`,
  });
}

// ─── PHC / ASHA Worker Alert ─────────────────────────────────────────────────

export async function alertHealthCenter(params: {
  healthCenterPhone: string;
  passengerName: string;
  pickup: string;
  estimatedArrivalMinutes: number;
}): Promise<void> {
  const { healthCenterPhone, passengerName, pickup, estimatedArrivalMinutes } = params;
  await client.messages.create({
    to: healthCenterPhone,
    from: FROM,
    body:
      `Graamin Go Emergency Alert:\n` +
      `Patient ${passengerName} is on the way from ${pickup}.\n` +
      `Estimated arrival: ${estimatedArrivalMinutes} minutes.`,
  });
}
