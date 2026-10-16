import { NextResponse } from "next/server";
import { validWebhookSignature } from "@/lib/paystack";
import { confirmBooking } from "@/lib/bookings";

// Set this URL in Paystack → Settings → API Keys & Webhooks:
//   https://YOUR-SITE/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const event = JSON.parse(raw);
    if (event?.event === "charge.success" && event?.data?.reference) {
      await confirmBooking(String(event.data.reference));
    }
  } catch (e) {
    console.error("paystack webhook", e);
  }
  return NextResponse.json({ ok: true });
}
