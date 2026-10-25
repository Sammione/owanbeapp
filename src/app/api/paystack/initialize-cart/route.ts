import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializeTransaction } from "@/lib/paystack";
import { defaultDeposit, overlaps } from "@/lib/pricing";
import { addDays, todayISO } from "@/lib/format";
import { isValidReferralCode, normalizeReferralCode } from "@/lib/referrals";
import { checkCartBundleEligibility, BUNDLE_DISCOUNT_PERCENT } from "@/lib/bundles";

const HEAVY_CATEGORIES = [
  "Coolers & Ice Chests",
  "Cooking Pots & Burners",
  "Canopies, Tables & Chairs",
  "Generators & Sound Systems",
  "Chafing Dishes & Food Warmers",
];

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Please sign in to proceed with your booking." }, { status: 401 });
  }

  let body: {
    items?: { id: string; quantity: number }[];
    eventDate?: string;
    delivery?: boolean;
    deliveryAddress?: string;
    referralCode?: string;
    bundleDiscount?: number;
    totalDiscount?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { items: cartItems, eventDate } = body;
  const delivery = !!body.delivery;
  const address = (body.deliveryAddress ?? "").toString().slice(0, 300).trim();

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Your event basket is empty." }, { status: 400 });
  }
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return NextResponse.json({ error: "Please select a valid event date." }, { status: 400 });
  }
  if (eventDate < addDays(todayISO(), 2)) {
    return NextResponse.json({ error: "Please book at least 2 days before your event." }, { status: 400 });
  }
  if (eventDate > addDays(todayISO(), 180)) {
    return NextResponse.json({ error: "Bookings can be made up to 6 months in advance." }, { status: 400 });
  }
  if (delivery && address.length < 8) {
    return NextResponse.json({ error: "Please enter your complete delivery address in Lagos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const itemIds = cartItems.map((c) => c.id);

  const { data: dbItems, error: itemsErr } = await admin
    .from("items")
    .select("id,owner_id,title,price,deposit,status,category")
    .in("id", itemIds);

  if (itemsErr || !dbItems || dbItems.length === 0) {
    return NextResponse.json({ error: "Some items in your basket could not be found." }, { status: 404 });
  }

  const itemMap = new Map(dbItems.map((it) => [it.id, it]));

  // Date range for standard 3-day rental
  const startDate = addDays(eventDate, -1);
  const endDate = addDays(eventDate, 1);

  // Check availability and ownership
  let hasHeavy = false;
  const preparedBookings: any[] = [];
  let totalHire = 0;
  let totalDeposit = 0;
  const categoriesInCart: string[] = [];

  for (const c of cartItems) {
    const item = itemMap.get(c.id);
    if (!item || item.status !== "live") {
      return NextResponse.json({ error: `Item "${item?.title || 'Selected item'}" is not available.` }, { status: 400 });
    }
    if (item.owner_id === user.id) {
      return NextResponse.json({ error: `You cannot rent your own item ("${item.title}").` }, { status: 400 });
    }

    const qty = Math.max(1, c.quantity || 1);
    categoriesInCart.push(item.category);
    if (HEAVY_CATEGORIES.includes(item.category)) {
      hasHeavy = true;
    }

    // Check availability
    const { data: busy } = await admin.rpc("item_busy_ranges", { p_item: item.id });
    if ((busy ?? []).some((b: { start_date: string; end_date: string }) => overlaps(startDate, endDate, b.start_date, b.end_date))) {
      return NextResponse.json({
        error: `"${item.title}" is already booked for that weekend. Please remove it or change dates.`,
      }, { status: 409 });
    }

    const itemPrice = item.price * qty;
    const itemDeposit = (item.deposit ?? defaultDeposit(item.price)) * qty;
    totalHire += itemPrice;
    totalDeposit += itemDeposit;

    preparedBookings.push({
      item_id: item.id,
      renter_id: user.id,
      event_date: eventDate,
      start_date: startDate,
      end_date: endDate,
      delivery,
      delivery_address: delivery ? address : null,
      rental_fee: itemPrice,
      cleaning_fee: 0,
      deposit: itemDeposit,
      status: "pending_payment",
      pickup_code: String(crypto.randomInt(1000, 10000)),
      item_title: item.title,
    });
  }

  // Calculate discounts
  let effectiveDiscount = 0;
  let appliedReferralCode: string | null = null;

  // 1. Referral discount check
  if (body.referralCode) {
    const refCheck = isValidReferralCode(body.referralCode, user.id);
    if (refCheck.valid) {
      effectiveDiscount += refCheck.discount;
      appliedReferralCode = normalizeReferralCode(body.referralCode);
    }
  }

  // 2. Outfit Bundle discount check (15% if 2+ distinct fashion categories)
  const bundleCheck = checkCartBundleEligibility(categoriesInCart);
  if (bundleCheck.isBundle) {
    const bundleDiscount = Math.round((totalHire * BUNDLE_DISCOUNT_PERCENT) / 100);
    effectiveDiscount += bundleDiscount;
  }

  // Ensure discount doesn't exceed totalHire
  effectiveDiscount = Math.min(totalHire, effectiveDiscount);
  const discountedHire = Math.max(0, totalHire - effectiveDiscount);

  // Calculate single consolidated delivery fee
  const deliveryFee = delivery ? (hasHeavy ? 8000 : 2500) : 0;
  const grandTotal = discountedHire + totalDeposit + deliveryFee;

  const reference = `OWC-CART-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // Assign delivery fee and deduct discount across bookings
  const insertedBookingIds: string[] = [];

  for (let i = 0; i < preparedBookings.length; i++) {
    const b = preparedBookings[i];
    const itemDeliveryFee = i === 0 ? deliveryFee : 0;
    // Deduct discount from the first booking's rental fee for accounting consistency
    const itemDiscount = i === 0 ? effectiveDiscount : 0;
    const itemRentalFee = Math.max(0, b.rental_fee - itemDiscount);
    const itemTotal = itemRentalFee + b.deposit + itemDeliveryFee;

    const { data: created, error: insErr } = await admin
      .from("bookings")
      .insert({
        item_id: b.item_id,
        renter_id: b.renter_id,
        event_date: b.event_date,
        start_date: b.start_date,
        end_date: b.end_date,
        delivery: b.delivery,
        delivery_address: b.delivery_address,
        rental_fee: itemRentalFee,
        cleaning_fee: b.cleaning_fee,
        delivery_fee: itemDeliveryFee,
        deposit: b.deposit,
        total: itemTotal,
        paystack_ref: reference,
        pickup_code: b.pickup_code,
      })
      .select("id")
      .single();

    if (insErr || !created) {
      console.error("Booking insert error:", insErr);
      if (insertedBookingIds.length > 0) {
        await admin.from("bookings").delete().in("id", insertedBookingIds);
      }
      return NextResponse.json({ error: "Could not create event booking records. Please try again." }, { status: 500 });
    }

    insertedBookingIds.push(created.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const tx = await initializeTransaction({
      email: user.email,
      amountNaira: grandTotal,
      reference,
      callbackUrl: `${site}/bookings/verify?ref=${encodeURIComponent(reference)}`,
      metadata: {
        is_cart: true,
        booking_ids: insertedBookingIds,
        item_count: preparedBookings.length,
        referral_code: appliedReferralCode,
        discount_applied: effectiveDiscount,
        is_bundle: bundleCheck.isBundle,
      },
    });

    return NextResponse.json({ url: tx.authorization_url });
  } catch (e: any) {
    console.error("Paystack transaction init error:", e);
    await admin.from("bookings").update({ status: "cancelled" }).in("id", insertedBookingIds);
    return NextResponse.json({ error: "Paystack could not initiate payment session. Please try again." }, { status: 502 });
  }
}
