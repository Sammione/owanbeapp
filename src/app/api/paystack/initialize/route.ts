import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction } from "@/lib/paystack";
import { quote, overlaps } from "@/lib/pricing";
import { addDays, todayISO } from "@/lib/format";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let body: { itemId?: string; eventDate?: string; delivery?: boolean; address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const { itemId, eventDate } = body;
  const delivery = !!body.delivery;
  const address = (body.address ?? "").toString().slice(0, 300).trim();

  if (!itemId || !/^[0-9a-f-]{36}$/i.test(itemId)) return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return NextResponse.json({ error: "Choose a valid event date." }, { status: 400 });
  if (eventDate < addDays(todayISO(), 2)) return NextResponse.json({ error: "Please book at least 2 days before your event." }, { status: 400 });
  if (eventDate > addDays(todayISO(), 180)) return NextResponse.json({ error: "You can book up to 6 months ahead." }, { status: 400 });
  if (delivery && address.length < 8) return NextResponse.json({ error: "Add a delivery address." }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin.from("items").select("id,owner_id,title,price,deposit,status,category").eq("id", itemId).maybeSingle();
  if (!item || item.status !== "live") return NextResponse.json({ error: "This item is not available right now." }, { status: 404 });
  if (item.owner_id === user.id) return NextResponse.json({ error: "You can’t rent your own item." }, { status: 400 });

  const q = quote(item, eventDate, delivery);

  // Make sure nobody else has it for these dates (including recent unpaid holds).
  const { data: busy } = await admin.rpc("item_busy_ranges", { p_item: itemId });
  if ((busy ?? []).some((b: { start_date: string; end_date: string }) => overlaps(q.start_date, q.end_date, b.start_date, b.end_date))) {
    return NextResponse.json({ error: "Someone already booked it around that date. Try another date." }, { status: 409 });
  }

  const reference = `OWC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const pickup_code = String(crypto.randomInt(1000, 10000));

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      item_id: itemId,
      renter_id: user.id,
      event_date: eventDate,
      start_date: q.start_date,
      end_date: q.end_date,
      delivery,
      delivery_address: delivery ? address : null,
      rental_fee: q.rental_fee,
      cleaning_fee: q.cleaning_fee,
      delivery_fee: q.delivery_fee,
      deposit: q.deposit,
      total: q.total,
      paystack_ref: reference,
      pickup_code,
    })
    .select("id")
    .single();
  if (error || !booking) {
    console.error(error);
    return NextResponse.json({ error: "Could not create your booking. Please try again." }, { status: 500 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  try {
    const tx = await initializeTransaction({
      email: user.email,
      amountNaira: q.total,
      reference,
      callbackUrl: `${site}/bookings/verify?ref=${encodeURIComponent(reference)}`,
      metadata: { booking_id: booking.id, item: item.title },
    });
    return NextResponse.json({ url: tx.authorization_url });
  } catch (e) {
    await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    console.error(e);
    return NextResponse.json({ error: "Paystack could not start the payment. Please try again." }, { status: 502 });
  }
}
