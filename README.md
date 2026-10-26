# OwanbeFit

Rent owambe outfits near you, or earn from the ones in your wardrobe.
A mobile-first web app built with **Next.js**, **Supabase** and **Paystack**.

## What it does

**Renters**
- Browse live outfits, search, and filter by event (Wedding, Burial, Birthday…), condition grade (A/B/C) and area.
- See photos, real measurements, grade, what’s included and the last cleaning date.
- Pick an event date (3-day rental), choose pickup or delivery, and pay rental + cleaning + refundable deposit with Paystack.
- Get a pickup code. See bookings, return dates and deposit refunds in **My rentals**.
- Save favourite looks.

**Owners**
- List an outfit with guided photos (front, back, fabric close-up, label, flaws), measurements, events, price and drop-off hub. Photos are compressed on the phone before upload.
- See listing status, rentals and earnings (70% of each rental). Pause or reopen a listing.

**Hub staff** (`/hub`)
- Inspect new listings with a condition checklist, assign **Grade A/B/C** and fabric quality, set the deposit and tag code, upload private condition photos, then approve or reject.
- Check out bookings (verifies the pickup code) and check in returns. Late fees and damage charges are worked out and the rest of the deposit is refunded automatically through Paystack.
- Refund double-bookings in one tap.

**Safety built in**
- Row level security on every table: owners can’t approve or grade their own items, renters only see their own bookings, owners only see a renter’s first name.
- Prices are always calculated on the server. Payments are verified with Paystack before a booking is confirmed (on the return page and by webhook).
- A database constraint makes double-booking impossible, including a 2-day cleaning gap after each return.

## Set up (about 20 minutes)

You need **Node.js 20+**, a free **Supabase** project and a **Paystack** account (test mode is fine).

### 1. Supabase
1. Create a project at supabase.com.
2. Open **SQL Editor → New query**, paste everything in `supabase/schema.sql` and run it. Then do the same with `supabase/seed.sql` (edit the hub names and addresses first).
3. **Authentication → Providers:** make sure **Email** is on.
4. **Authentication → URL Configuration:** set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. Add your live URLs here later too.
5. **Authentication → Emails → Magic Link** template: add `{{ .Token }}` somewhere in the email so people can type the 6-digit code instead of tapping the link (handy when the link opens in another browser).
6. **Project Settings → API:** copy the project URL, the `anon` key and the `service_role` key.

### 2. Paystack
1. In **Settings → API Keys & Webhooks**, copy your **test secret key**.
2. Set the webhook URL to `https://YOUR-SITE/api/paystack/webhook` once the site is online. Locally, the return page confirms payments on its own.

### 3. Run it
```bash
cp .env.example .env.local   # then fill in your keys
npm install
npm run dev
```
Open http://localhost:3000.

### 4. Make yourself an admin
Sign in once, then run in the Supabase SQL Editor:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Give hub partners the `hub` role the same way. They’ll see **Hub** in the menu.

### 5. Try the full flow
1. Sign in and list an outfit from **List**.
2. Open **Hub**, inspect it, grade it and approve it.
3. Sign in with a second email and rent it. Pay with one of Paystack’s test cards (see Paystack’s docs).
4. In **Hub**, check it out with the pickup code, then check in the return.

## Deploy to Vercel
1. Push this folder to a GitHub repo and import it in Vercel.
2. Add the same environment variables, with `NEXT_PUBLIC_SITE_URL` set to your live address.
3. Add `https://YOUR-SITE/auth/callback` to Supabase Redirect URLs and update the Site URL.
4. Set the Paystack webhook to `https://YOUR-SITE/api/paystack/webhook`.
5. When you’re ready for real money, switch to Paystack live keys.

## Project layout
```
supabase/schema.sql      tables, security rules, storage buckets, double-booking guard
supabase/seed.sql        starter hubs
src/app/page.tsx         browse and filters
src/app/items/[id]/      outfit page, gallery, save, booking
src/app/list/            owner listing form with photo upload
src/app/me/              rentals, listings and earnings, saved, profile
src/app/hub/             staff dashboard, inspection, check-out and returns
src/app/api/paystack/    start payment and webhook
src/lib/                 pricing, Supabase clients, Paystack helpers
```

## Business rules you can change
All in `src/lib/constants.ts` and `src/lib/pricing.ts`: cleaning fee (₦2,000), delivery fee (₦2,500), owner share (70%), rental length (3 days), cleaning gap (2 days), default deposit (about 130% of the price, minimum ₦5,000) and late fee per day (15% of the price, minimum ₦1,000).

## Not built yet (good next steps)
- Owners blocking dates when they want to wear an item themselves, and editing a listing after it’s live.
- Paying owners automatically (for now, pay them from the **Earned** figures using Paystack Transfers or your bank).
- WhatsApp or SMS messages for confirmations and return reminders.
- ID verification for renters (for example a NIN check through a verification provider) and phone-number sign-in.
- An admin screen for adding hubs (add them in Supabase for now).

## Dependencies
Versions are pinned to releases that were at least two weeks old when this was built (October 2026). Newer security patches for Next.js and React were released on 14 October 2026. Run `npm audit` and update to the latest patch versions before you launch.
