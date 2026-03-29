import { NextRequest, NextResponse } from "next/server";
import { handleIncomingWAMessage } from "@/lib/whatsapp";

// ─── Webhook verification (Meta requires GET with verify_token) ───────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── Receive incoming messages ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends a nested structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Status update or other non-message webhook — acknowledge
      return NextResponse.json({ status: "ok" });
    }

    const message = messages[0];
    const fromPhone = message.from; // e.g. "919876543210"
    const text = message.text?.body ?? "";

    if (!text) return NextResponse.json({ status: "ok" });

    // Handle async — don't block the webhook response
    handleIncomingWAMessage(`+${fromPhone}`, text).catch(console.error);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "ok" }); // Always return 200 to Meta
  }
}
