import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { addDays, naira, niceDate, todayISO } from "@/lib/format";
import { Photo } from "@/components/Photo";
import { refundConflict } from "./actions";

type Rel<T> = T | T[] | null;
const one = <T,>(r: Rel<T>) => (Array.isArray(r) ? r[0] ?? null : r);

export const dynamic = "force-dynamic";

export default async function Hub({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const today = todayISO();

  const [{ data: pending }, { data: toGo }, { data: out }, { data: conflicts }] = await Promise.all([
    supabase.from("items").select("id,title,photos,price,created_at,hub:hubs(name)").eq("status", "pending").order("created_at"),
    supabase.from("bookings").select("id,start_date,event_date,delivery,item:items(title,photos)").eq("status", "paid").lte("start_date", addDays(today, 1)).order("start_date"),
    supabase.from("bookings").select("id,end_date,item:items(title,photos)").eq("status", "out").order("end_date"),
    supabase.from("bookings").select("id,total,item:items(title)").eq("status", "conflict"),
  ]);

  const Section = ({ title, count, children }: { title: string; count: number; children: React.ReactNode }) => (
    <section className="stack g10">
      <div className="row between"><h2>{title}</h2><span className="pill">{count}</span></div>
      {count ? children : <p className="muted small">Nothing here right now.</p>}
    </section>
  );

  return (
    <div className="container">
      <div className="stack g4">
        <h1>Hub dashboard</h1>
        <p className="muted">{niceDate(today)} · check, grade and hand over outfits</p>
      </div>
      {sp.done && <p className="notice ok" role="status">{sp.done}</p>}

      {(conflicts ?? []).length > 0 && (
        <Section title="Refunds needed" count={conflicts!.length}>
          {conflicts!.map((b) => (
            <form key={b.id} action={refundConflict} className="listrow">
              <input type="hidden" name="id" value={b.id} />
              <div className="stack" style={{ flex: 1 }}>
                <strong className="small">{one(b.item as Rel<{ title: string }>)?.title}</strong>
                <span className="small muted">Double-booked. Refund the full {naira(b.total)}.</span>
              </div>
              <button className="btn small danger">Refund</button>
            </form>
          ))}
        </Section>
      )}

      <Section title="Hand over (today and tomorrow)" count={(toGo ?? []).length}>
        {(toGo ?? []).map((b) => {
          const it = one(b.item as Rel<{ title: string; photos: string[] }>);
          return (
            <Link key={b.id} href={`/hub/bookings/${b.id}`} className="listrow">
              <Photo src={it?.photos?.[0]} alt={it?.title ?? ""} className="thumb" />
              <div className="stack" style={{ flex: 1 }}>
                <strong className="small">{it?.title}</strong>
                <span className="small muted">{b.delivery ? "Deliver" : "Pickup"} {niceDate(b.start_date)} · event {niceDate(b.event_date)}</span>
              </div>
              <span className={`pill ${b.start_date < today ? "bad" : "warn"}`}>{b.start_date < today ? "Late" : "Check out"}</span>
            </Link>
          );
        })}
      </Section>

      <Section title="Out with renters" count={(out ?? []).length}>
        {(out ?? []).map((b) => {
          const it = one(b.item as Rel<{ title: string; photos: string[] }>);
          const overdue = b.end_date < today;
          return (
            <Link key={b.id} href={`/hub/bookings/${b.id}`} className="listrow">
              <Photo src={it?.photos?.[0]} alt={it?.title ?? ""} className="thumb" />
              <div className="stack" style={{ flex: 1 }}>
                <strong className="small">{it?.title}</strong>
                <span className="small muted">Due back {niceDate(b.end_date)}</span>
              </div>
              <span className={`pill ${overdue ? "bad" : ""}`}>{overdue ? "Overdue" : "Check in"}</span>
            </Link>
          );
        })}
      </Section>

      <Section title="New listings to inspect" count={(pending ?? []).length}>
        {(pending ?? []).map((it) => (
          <Link key={it.id} href={`/hub/items/${it.id}`} className="listrow">
            <Photo src={it.photos?.[0]} alt={it.title} className="thumb" />
            <div className="stack" style={{ flex: 1 }}>
              <strong className="small">{it.title}</strong>
              <span className="small muted">{one(it.hub as Rel<{ name: string }>)?.name ?? "No hub"} · listed {niceDate(it.created_at.slice(0, 10))} · {naira(it.price)}</span>
            </div>
            <span className="pill warn">Inspect</span>
          </Link>
        ))}
      </Section>
    </div>
  );
}
