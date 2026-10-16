import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { naira, niceDate } from "@/lib/format";
import { ownerEarning } from "@/lib/pricing";
import { Photo } from "@/components/Photo";
import { ItemCard } from "@/components/ItemCard";
import { ProfileForm } from "./ProfileForm";
import { BankSettingsForm } from "./BankSettingsForm";
import { setListingStatus } from "./actions";

const TABS = [
  { key: "rentals", label: "My rentals" },
  { key: "listings", label: "My listings" },
  { key: "saved", label: "Saved" },
  { key: "profile", label: "Profile & Payouts" },
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

export default async function Me({ searchParams }: { searchParams: Promise<{ tab?: string; listed?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "rentals";
  const { supabase, user, profile } = await requireUser(`/me?tab=${tab}`);

  let body: React.ReactNode = null;

  if (tab === "rentals") {
    const { data } = await supabase
      .from("bookings")
      .select("id,item_id,event_date,start_date,end_date,status,total,deposit,deposit_refund,pickup_code,delivery,late_fee,damage_charge,item:items(title,photos)")
      .eq("renter_id", user.id)
      .in("status", ["paid", "out", "returned", "completed", "conflict"])
      .order("event_date", { ascending: false });
    const rows = data ?? [];
    body = rows.length ? (
      <div className="stack g10">
        {rows.map((b) => {
          const it = one(b.item as Rel<{ title: string; photos: string[] }>);
          const [label, tone] = BOOKING_LABEL[b.status] ?? [b.status, ""];
          return (
            <Link key={b.id} href={`/items/${b.item_id}`} className="listrow">
              <Photo src={it?.photos?.[0]} alt={it?.title ?? "Outfit"} className="thumb" />
              <div className="stack g4" style={{ flex: 1, minWidth: 0 }}>
                <div className="row between g8"><strong className="small">{it?.title}</strong><span className={`pill ${tone}`}>{label}</span></div>
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
          );
        })}
      </div>
    ) : (
      <div className="empty">
        <strong>No rentals yet.</strong>
        <p className="muted">When you rent an outfit, your pickup code and return date show up here.</p>
        <Link href="/" className="btn small">Find an outfit</Link>
      </div>
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
        {sp.listed && <p className="notice ok">Listed! Drop your outfit at the hub you chose. Once it’s checked and cleaned, it goes live.</p>}
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
            <strong>You haven’t listed any outfits yet.</strong>
            <p className="muted">Earn 70% of every rental from clothes hanging in your wardrobe.</p>
            <Link href="/list" className="btn small">List an outfit</Link>
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

  if (tab === "profile") {
    body = (
      <div className="stack g20 narrow" style={{ maxWidth: 540, margin: 0 }}>
        <ProfileForm profile={profile ?? { full_name: null, phone: null, area: null }} email={user.email ?? ""} />
        <BankSettingsForm initialData={user.user_metadata} />
        <form action="/auth/signout" method="post"><button className="btn ghost block">Sign out</button></form>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{profile?.full_name ? `Hi ${profile.full_name.split(" ")[0]}` : "My account"}</h1>
      <nav className="tabs" aria-label="Account sections">
        {TABS.map((t) => (
          <Link key={t.key} href={`/me?tab=${t.key}`} className={tab === t.key ? "on" : ""} aria-current={tab === t.key ? "page" : undefined}>{t.label}</Link>
        ))}
      </nav>
      {!profile?.full_name && tab !== "profile" && (
        <p className="notice">Add your name and WhatsApp number in <Link href="/me?tab=profile">Profile</Link> so we can reach you about pickups.</p>
      )}
      {body}
    </div>
  );
}
