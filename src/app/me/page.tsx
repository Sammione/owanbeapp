import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { naira, niceDate } from "@/lib/format";
import { ownerEarning } from "@/lib/pricing";
import { Photo } from "@/components/Photo";
import { ItemCard } from "@/components/ItemCard";
import { ProfileForm } from "./ProfileForm";
import { BankSettingsForm } from "./BankSettingsForm";
import { setListingStatus } from "./actions";
import { PersonaSwitcher, type PersonaMode } from "@/components/PersonaSwitcher";
import { Icon } from "@/components/Icon";
import { ReferralsHub } from "@/components/ReferralsHub";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { generateUserReferralCode } from "@/lib/referrals";

const RENTER_TABS = [
  { key: "rentals", label: "My Rentals" },
  { key: "referrals", label: "Invite & Earn ₦500" },
  { key: "saved", label: "Saved Outfits & Shoes" },
  { key: "profile", label: "Account Profile" },
] as const;

const LENDER_TABS = [
  { key: "listings", label: "My Listings & Halls" },
  { key: "subscription", label: "Venue Subscription" },
  { key: "bank", label: "Payout Bank (NUBAN)" },
  { key: "profile", label: "Partner Profile" },
] as const;

const BOOKING_LABEL: Record<string, [string, string]> = {
  paid: ["Confirmed", "ok"],
  out: ["With you", "warn"],
  returned: ["Returned · checking", ""],
  completed: ["Completed", ""],
  conflict: ["Refund due", "bad"],
};
const ITEM_LABEL: Record<string, [string, string]> = {
  pending: ["Waiting for hub check", "warn"],
  live: ["Live", "ok"],
  paused: ["Paused", ""],
  rejected: ["Not accepted", "bad"],
  retired: ["Removed", ""],
};

type Rel<T> = T | T[] | null;
const one = <T,>(r: Rel<T>) => (Array.isArray(r) ? r[0] ?? null : r);

export default async function Me({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; listed?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const isLender = sp.mode === "lender" || sp.tab === "listings" || sp.tab === "bank";
  const activeMode: PersonaMode = isLender ? "lender" : "renter";
  const activeTabs = isLender ? LENDER_TABS : RENTER_TABS;
  const defaultTab = isLender ? "listings" : "rentals";

  const tab = activeTabs.some((t) => t.key === sp.tab) ? sp.tab! : defaultTab;
  const { supabase, user, profile } = await requireUser(`/me?mode=${activeMode}&tab=${tab}`);
  const isHallManager = profile?.vendor_type === "hall_manager";

  let body: React.ReactNode = null;

  if (tab === "rentals") {
    const { data } = await supabase
      .from("bookings")
      .select("id,item_id,event_date,start_date,end_date,status,total,deposit,deposit_refund,pickup_code,delivery,late_fee,damage_charge,item:items(title,photos)")
      .eq("renter_id", user.id)
      .in("status", ["paid", "out", "returned", "completed", "conflict"])
      .order("event_date", { ascending: false });
    const rows = data ?? [];
    body = (
      <div className="stack g14">
        {/* Smart Push Notifications Widget for upcoming rentals */}
        <PushNotificationManager
          booking={
            rows[0]
              ? {
                  id: rows[0].id,
                  event_date: rows[0].event_date,
                  start_date: rows[0].start_date,
                  end_date: rows[0].end_date,
                  pickup_code: rows[0].pickup_code,
                  delivery: rows[0].delivery,
                  item_title: one(rows[0].item as Rel<{ title: string; photos: string[] }>)?.title,
                  deposit: rows[0].deposit,
                }
              : null
          }
        />

        {rows.length ? (
          <div className="stack g10">
            {rows.map((b) => {
              const it = one(b.item as Rel<{ title: string; photos: string[] }>);
              const [label, tone] = BOOKING_LABEL[b.status] ?? [b.status, ""];
              return (
                <div key={b.id} className="listrow between" style={{ alignItems: "center" }}>
                  <Link href={`/items/${b.item_id}`} style={{ display: "flex", gap: 12, flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                    <Photo src={it?.photos?.[0]} alt={it?.title ?? "Outfit"} className="thumb" />
                    <div className="stack g4" style={{ flex: 1, minWidth: 0 }}>
                      <div className="row between g8">
                        <strong className="small">{it?.title}</strong>
                        <span className={`pill ${tone}`}>{label}</span>
                      </div>
                      <span className="small muted">Event {niceDate(b.event_date)} · return by {niceDate(b.end_date)}</span>
                      {["paid", "out"].includes(b.status) && <span className="small">Pickup code <strong>{b.pickup_code}</strong></span>}
                      {b.status === "completed" && (
                        <span className="small muted">
                          Deposit refunded {naira(b.deposit_refund ?? b.deposit)}
                          {(b.late_fee || b.damage_charge) ? ` (late fee ${naira(b.late_fee)}, damage ${naira(b.damage_charge)})` : ""}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Review / Rate CTA */}
                  <div style={{ marginLeft: 8 }}>
                    <Link
                      href={`/items/${b.item_id}`}
                      className="btn small ghost"
                      style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}
                    >
                      ★ Rate Look
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <strong>No rentals yet.</strong>
            <p className="muted">When you rent an outfit, your pickup code and return date show up here.</p>
            <Link href="/" className="btn small">Find an outfit</Link>
          </div>
        )}
      </div>
    );
  }

  if (tab === "referrals") {
    const userRefCode = generateUserReferralCode(user.id, profile?.full_name);
    body = (
      <ReferralsHub
        referralCode={userRefCode}
        userName={profile?.full_name}
        credits={500}
      />
    );
  }

  if (tab === "listings") {
    const { data: items } = await supabase.from("items").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
    const ids = (items ?? []).map((i) => i.id);
    const { data: bookings } = ids.length
      ? await supabase.from("bookings").select("item_id,status,rental_fee,owner_payout,event_date").in("item_id", ids).in("status", ["paid", "out", "returned", "completed"])
      : { data: [] as { item_id: string; status: string; rental_fee: number; owner_payout: number | null; event_date: string }[] };
    const earned = (bookings ?? []).filter((b) => b.status === "completed").reduce((a, b) => a + (b.owner_payout ?? ownerEarning(b.rental_fee)), 0);
    const upcoming = (bookings ?? []).filter((b) => b.status !== "completed").reduce((a, b) => a + ownerEarning(b.rental_fee), 0);
    body = (
      <div className="stack g12">
        {sp.listed && (
          <p className="notice ok">
            {isHallManager
              ? "Event Hall Listed! Your venue profile is now live with 5-photo showcase, direct WhatsApp tour booking, and date reservation escrow. 30-day free launch trial active."
              : "Listed! Drop your outfit at the hub you chose. Once it’s checked and cleaned, it goes live."}
          </p>
        )}
        <div className="kpis">
          <div className="kpi dark"><span>Earned so far</span><strong>{naira(earned)}</strong></div>
          <div className="kpi"><span>Coming from upcoming rentals</span><strong>{naira(upcoming)}</strong></div>
        </div>
        {(items ?? []).length ? (
          (items ?? []).map((it) => {
            const [label, tone] = ITEM_LABEL[it.status] ?? [it.status, ""];
            const count = (bookings ?? []).filter((b) => b.item_id === it.id).length;
            return (
              <div key={it.id} className="listrow between">
                <Photo src={it.photos?.[0]} alt={it.title} className="thumb" />
                <div className="stack g4" style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between g8">
                    <Link href={`/items/${it.id}`}><strong className="small">{it.title}</strong></Link>
                    <span className={`pill ${tone}`}>{label}</span>
                  </div>
                  <span className="small muted">{naira(it.price)} / rental · you get {naira(ownerEarning(it.price))}</span>
                  <span className="small muted">{count} booking{count === 1 ? "" : "s"}</span>
                  {it.status === "rejected" && it.rejection_reason && <p className="error small">{it.rejection_reason}</p>}
                </div>
                <div className="row g6">
                  {it.status === "live" && (
                    <form action={setListingStatus}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="status" value="paused" />
                      <button className="btn small ghost">Pause</button>
                    </form>
                  )}
                  {it.status === "paused" && (
                    <form action={setListingStatus}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="status" value="live" />
                      <button className="btn small ghost">Unpause</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">
            <strong>{isHallManager ? "You haven’t listed any event halls yet." : "You haven’t listed any outfits yet."}</strong>
            <p className="muted">
              {isHallManager
                ? "List your event hall, marquee, or garden venue with 5 high-res photos and connect directly with Lagos celebrants (0% commission)."
                : "Earn 70% of every rental from clothes hanging in your wardrobe."}
            </p>
            <Link href={isHallManager ? "/list?type=venue" : "/list"} className="btn small">
              {isHallManager ? "List an Event Hall / Venue" : "List an outfit"}
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (tab === "saved") {
    const { data } = await supabase.from("saved").select("item:items(id,title,price,photos,grade,status)").eq("user_id", user.id);
    const items = (data ?? [])
      .map((r) => one(r.item as Rel<{ id: string; title: string; price: number; photos: string[]; grade: "A" | "B" | "C" | null; status: string }>))
      .filter((x): x is NonNullable<typeof x> => !!x && x.status === "live");
    body = items.length ? (
      <div className="outfit-grid">{items.map((it) => <ItemCard key={it.id} item={it} />)}</div>
    ) : (
      <div className="empty">
        <strong>No saved looks yet.</strong>
        <p className="muted">Tap the heart on any outfit to keep it here for your next owambe.</p>
        <Link href="/" className="btn small">Browse outfits</Link>
      </div>
    );
  }

  if (tab === "subscription") {
    body = (
      <div className="stack g20 narrow" style={{ maxWidth: 540, margin: 0 }}>
        <div className="box" style={{ background: "rgba(22, 83, 55, 0.08)", borderColor: "rgba(22, 83, 55, 0.3)" }}>
          <div className="row between" style={{ alignItems: "center" }}>
            <span className="pill ok">Active Launch Trial</span>
            <span className="tiny muted">Renews in 28 days</span>
          </div>
          <h2 style={{ margin: "12px 0 4px", fontSize: 24 }}>Venue Partner Subscription</h2>
          <p className="muted small" style={{ margin: 0 }}>
            List your event hall, ballroom, or marquee across Lagos with verified badge and direct WhatsApp client leads.
          </p>

          <div className="hr" style={{ margin: "16px 0" }} />

          <div className="stack g10">
            <div className="line">
              <span>Monthly Subscription Token</span>
              <strong style={{ fontSize: 18 }}>₦7,500 / month</strong>
            </div>
            <div className="line">
              <span>Commission on Bookings</span>
              <strong style={{ color: "var(--grade-a, #165337)" }}>0% (You keep 100%)</strong>
            </div>
            <div className="line">
              <span>Direct WhatsApp Tour Leads</span>
              <strong>Unlimited</strong>
            </div>
            <div className="line">
              <span>High-Res 5-Photo Showcase</span>
              <strong>Active</strong>
            </div>
          </div>

          <div className="hr" style={{ margin: "16px 0" }} />

          <div className="box" style={{ background: "rgba(255, 255, 255, 0.04)", padding: 12 }}>
            <span className="small">Paystack Auto-Renewal Token</span>
            <p className="tiny muted" style={{ margin: "4px 0 0" }}>
              Charged every 30 days via Paystack card or bank debit. Cancel anytime from this dashboard.
            </p>
          </div>
        </div>

        <div className="box">
          <h3 style={{ margin: "0 0 10px" }}>Lead &amp; Inquiry Activity</h3>
          <div className="grid2">
            <div className="box" style={{ padding: 12, textAlign: "center" }}>
              <span className="tiny muted">Catalog Views</span>
              <strong style={{ fontSize: 22, display: "block", marginTop: 4 }}>142</strong>
            </div>
            <div className="box" style={{ padding: 12, textAlign: "center" }}>
              <span className="tiny muted">WhatsApp Inquiries</span>
              <strong style={{ fontSize: 22, display: "block", marginTop: 4, color: "#25D366" }}>18</strong>
            </div>
          </div>
        </div>

        <Link
          href="/list?type=venue"
          className="btn block"
          style={{
            background: "var(--grade-a, #165337)",
            color: "#fff",
            borderColor: "var(--grade-a, #165337)",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Icon name="plus" size={16} stroke={2.4} />
          <span>+ List / Setup Your Event Hall</span>
        </Link>
      </div>
    );
  }

  if (tab === "bank") {
    body = (
      <div className="stack g20 narrow" style={{ maxWidth: 540, margin: 0 }}>
        <div className="box" style={{ background: "rgba(212, 175, 55, 0.08)", borderColor: "rgba(212, 175, 55, 0.3)" }}>
          <h3 style={{ margin: "0 0 6px" }}>Paystack NUBAN Payout Account</h3>
          <p className="small muted">
            Earnings (70% per rental) are automatically transferred to your verified Nigerian bank account after every clean return. Your bank details and identity are strictly private from renters.
          </p>
        </div>
        <BankSettingsForm initialData={user.user_metadata} />
      </div>
    );
  }

  if (tab === "profile") {
    body = (
      <div className="stack g20 narrow" style={{ maxWidth: 540, margin: 0 }}>
        <ProfileForm profile={profile ?? { full_name: null, phone: null, area: null }} email={user.email ?? ""} />
        {isLender && <BankSettingsForm initialData={user.user_metadata} />}
        <form action="/auth/signout" method="post"><button className="btn ghost block">Sign out</button></form>
      </div>
    );
  }

  return (
    <div className="container">
      {profile && ["admin", "hub"].includes(profile.role) && (
        <div
          className="box"
          style={{
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(26, 26, 28, 0.95) 100%)",
            borderColor: "var(--gold)",
            color: "#fff",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "16px 20px",
          }}
        >
          <div>
            <div className="row g8" style={{ alignItems: "center", marginBottom: 4 }}>
              <span className="pill ok" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Admin Role Active</span>
              <strong style={{ color: "var(--gold)", fontSize: "1.05rem" }}>Owambe Hub &amp; Operations Desk</strong>
            </div>
            <p className="small muted" style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
              You are signed in as an administrator. You can review pending listings, manage checkouts, and issue deposit refunds.
            </p>
          </div>
          <Link href="/hub" className="btn small" style={{ background: "var(--gold)", color: "#111", fontWeight: 700 }}>
            Enter Admin Hub Dashboard →
          </Link>
        </div>
      )}

      <PersonaSwitcher currentMode={activeMode} />

      <div className="row between" style={{ alignItems: "baseline", marginBottom: 8 }}>
        <h1>{profile?.full_name ? `Hi ${profile.full_name.split(" ")[0]}` : "My account"}</h1>
        {isLender && (
          <Link href={isHallManager ? "/list?type=venue" : "/list"} className="btn small">
            {isHallManager ? "+ List Hall or Venue" : "+ List Outfit or Shoes"}
          </Link>
        )}
      </div>

      <nav className="tabs" aria-label="Account sections">
        {activeTabs.map((t) => (
          <Link
            key={t.key}
            href={`/me?mode=${activeMode}&tab=${t.key}`}
            className={tab === t.key ? "on" : ""}
            aria-current={tab === t.key ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {!profile?.full_name && tab !== "profile" && (
        <p className="notice">
          Add your name and WhatsApp number in{" "}
          <Link href={`/me?mode=${activeMode}&tab=profile`}>Profile</Link> so the hub can coordinate handovers privately.
        </p>
      )}
      {body}
    </div>
  );
}
