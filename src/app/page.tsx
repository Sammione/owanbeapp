import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemCard } from "@/components/ItemCard";
import { Icon } from "@/components/Icon";
import {
  AREAS,
  EVENTS,
  CATEGORIES,
  COLORS,
  FASHION_CATEGORIES,
  VENUE_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  SERVICE_CATEGORIES,
} from "@/lib/constants";
import { DEMO_VENUES } from "@/lib/demo-venues";

type SP = Promise<{
  q?: string;
  event?: string;
  grade?: string;
  area?: string;
  category?: string;
  color?: string;
  pillar?: string;
}>;

const PILLARS = [
  { id: "all", label: "All Rentals" },
  { id: "venues", label: "Halls & Venues" },
  { id: "fashion", label: "Attire & Footwear" },
  { id: "equipment", label: "Event Equipment" },
  { id: "services", label: "Catering & Services" },
] as const;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const event = EVENTS.includes(sp.event as (typeof EVENTS)[number]) ? sp.event! : "";
  const grade = ["A", "B", "C"].includes(sp.grade ?? "") ? sp.grade! : "";
  const area = AREAS.includes(sp.area as (typeof AREAS)[number]) ? sp.area! : "Ikotun";
  const category = CATEGORIES.includes(sp.category as (typeof CATEGORIES)[number]) ? sp.category! : "";
  const color = COLORS.find((c) => c.value === sp.color)?.value ?? "";
  const pillar = (["all", "venues", "fashion", "equipment", "services"] as const).includes(sp.pillar as any)
    ? sp.pillar!
    : "";

  const supabase = await createClient();
  let query = supabase
    .from("items")
    .select("id,title,price,photos,grade,category,events,hub:hubs(area)")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(80);

  if (category) {
    query = query.eq("category", category);
  } else if (pillar === "venues") {
    query = query.in("category", [...VENUE_CATEGORIES]);
  } else if (pillar === "equipment") {
    query = query.in("category", [...EQUIPMENT_CATEGORIES]);
  } else if (pillar === "services") {
    query = query.in("category", [...SERVICE_CATEGORIES]);
  } else if (pillar === "fashion") {
    query = query.in("category", [...FASHION_CATEGORIES]);
  }

  if (event) query = query.contains("events", [event]);
  if (grade) query = query.eq("grade", grade);

  if (color) {
    const colorObj = COLORS.find((c) => c.value === color);
    const keywords = colorObj?.keywords ?? [color];
    const colorFilter = keywords
      .map((k) => `title.ilike.%${k}%,description.ilike.%${k}%`)
      .join(",");
    query = query.or(colorFilter);
  }

  if (q) {
    const safe = q.replace(/[%,()*]/g, " ");
    query = query.or(`title.ilike.%${safe}%,category.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  const { data, error } = await query;

  type Row = {
    id: string;
    title: string;
    price: number;
    photos: string[];
    grade: "A" | "B" | "C" | null;
    category: string;
    hub: { area: string } | { area: string }[] | null;
  };

  const dbItems = ((data ?? []) as Row[]).map((r) => ({
    ...r,
    hub_area: Array.isArray(r.hub) ? r.hub[0]?.area ?? null : r.hub?.area ?? null,
  }));

  const matchingDemoVenues = DEMO_VENUES.filter((v) => {
    if (pillar && pillar !== "all" && pillar !== "venues") return false;
    if (category && v.category !== category) return false;
    if (event && !v.events.includes(event)) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!v.title.toLowerCase().includes(needle) && !(v.description ?? "").toLowerCase().includes(needle)) {
        return false;
      }
    }
    return true;
  });

  const items = [...dbItems, ...matchingDemoVenues]
    .sort((a, b) => Number(b.hub_area === area) - Number(a.hub_area === area));

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({
      ...(q && { q }),
      ...(event && { event }),
      ...(grade && { grade }),
      ...(category && { category }),
      ...(color && { color }),
      ...(pillar && { pillar }),
      area,
      ...patch,
    });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/?${p.toString()}`;
  };

  const isFiltered = !!(q || event || grade || category || color || pillar);
  const heroFeaturedItem = items.find((it) => it.photos && it.photos.length > 0) ?? items[0];

  let activeCategoryLinks: { name: string; query: string }[] = [];
  if (pillar === "venues") {
    activeCategoryLinks = [
      { name: "All Halls & Venues", query: "" },
      ...VENUE_CATEGORIES.map((c) => ({ name: c, query: c })),
    ];
  } else if (pillar === "equipment") {
    activeCategoryLinks = [
      { name: "All Equipment", query: "" },
      ...EQUIPMENT_CATEGORIES.map((c) => ({ name: c, query: c })),
    ];
  } else if (pillar === "services") {
    activeCategoryLinks = [
      { name: "All Catering & Services", query: "" },
      ...SERVICE_CATEGORIES.map((c) => ({ name: c, query: c })),
    ];
  } else if (pillar === "fashion") {
    activeCategoryLinks = [
      { name: "All Attire & Shoes", query: "" },
      ...FASHION_CATEGORIES.map((c) => ({ name: c, query: c })),
    ];
  } else {
    activeCategoryLinks = [
      { name: "All Collections", query: "" },
      { name: "Halls & Marquees", query: "Event Halls & Marquees" },
      { name: "Garden Venues", query: "Garden & Outdoor Venues" },
      { name: "Aso-ebi / Lace", query: "Aso-ebi / lace" },
      { name: "Agbada", query: "Agbada" },
      { name: "Shoes & Footwear", query: "Shoes & Footwear" },
      { name: "Coolers & Ice Chests", query: "Coolers & Ice Chests" },
      { name: "Cooking Pots & Burners", query: "Cooking Pots & Burners" },
      { name: "Party Catering & Jollof", query: "Party Catering & Jollof" },
      { name: "Chafing Dishes", query: "Chafing Dishes & Food Warmers" },
      { name: "Canopies & Chairs", query: "Canopies, Tables & Chairs" },
      { name: "Cocktails & Bar", query: "Cocktails & Drinks Bar" },
    ];
  }

  return (
    <div className="container">
      {/* Clean Editorial Hero */}
      {!isFiltered && (
        <section className="clean-hero">
          <div className="hero-text-block">
            <span className="hero-kicker">Lagos One-Stop Event Marketplace</span>

            <h1 className="hero-heading">
              Rent the Look, the Venue <br />
              <em>& the Feast for your Owambe.</em>
            </h1>

            <p className="hero-body">
              Everything for your Lagos celebration in one verified place. Book luxury Marquees &amp; Banquet Halls, rent bespoke Aso-ebi, Agbada, and designer footwear, plus heavy-duty beverage coolers, cast-iron pots, and verified party caterers across Ikotun, Egbeda, and Igando.
            </p>

            <div className="hero-actions">
              <a href="#catalog" className="btn">
                Browse Event Essentials
              </a>
              <Link href="/list" className="btn ghost">
                List Attire, Equipment or Services
              </Link>
            </div>

            <div className="hero-trust-bar">
              <div className="hero-trust-item">
                <Icon name="shield" size={15} stroke={2} />
                <span>Hub Inspected</span>
              </div>
              <div className="hero-trust-item">
                <Icon name="truck" size={15} stroke={2} />
                <span>Van &amp; Bike Logistics</span>
              </div>
              <div className="hero-trust-item">
                <Icon name="lock" size={15} stroke={2} />
                <span>Paystack Escrow Protection</span>
              </div>
              <div className="hero-trust-item">
                <Icon name="check" size={15} stroke={2.2} />
                <span>Confidential Transactions</span>
              </div>
            </div>
          </div>

          {/* Hero Editorial Visual */}
          {heroFeaturedItem && (
            <div className="hero-image-wrap">
              <img
                src={heroFeaturedItem.photos[0]}
                alt={heroFeaturedItem.title}
                loading="eager"
              />
              <div className="hero-image-caption">
                <span className="hic-title">{heroFeaturedItem.title}</span>
                <span className="hic-price">From ₦{heroFeaturedItem.price.toLocaleString()}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Unified Search & Filter Toolbar */}
      <div id="catalog" className="filter-toolbar">
        <form action="/" method="get" className="search-hub-row" role="search">
          <label className="search-input-box">
            <Icon name="search" size={18} stroke={1.8} />
            <span className="sr">Search outfits, equipment or caterers</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search attire, coolers, pots, caterers (e.g. 150L cooler, velvet agbada, party jollof)…"
            />
          </label>

          <div className="hub-select-box">
            <Icon name="pin" size={15} stroke={1.8} />
            <span className="sr">Hub location</span>
            <select name="area" defaultValue={area}>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  Hub: {a}
                </option>
              ))}
            </select>
          </div>

          {event && <input type="hidden" name="event" value={event} />}
          {grade && <input type="hidden" name="grade" value={grade} />}
          {category && <input type="hidden" name="category" value={category} />}
          {color && <input type="hidden" name="color" value={color} />}
          {pillar && <input type="hidden" name="pillar" value={pillar} />}

          <button type="submit" className="btn small" style={{ flex: "none" }}>
            Search
          </button>
        </form>

        {/* 3 Pillars of Owambe Essentials */}
        <div className="pillar-nav-bar" role="tablist" aria-label="Event Essentials Type">
          {PILLARS.map((p) => {
            const active = (pillar || "all") === p.id;
            return (
              <Link
                key={p.id}
                href={link({ pillar: p.id === "all" ? "" : p.id, category: "" })}
                className={`pillar-pill-btn ${active ? "active" : ""}`}
                role="tab"
                aria-selected={active}
              >
                {p.label}
              </Link>
            );
          })}
        </div>

        {/* Category Navigation Links */}
        <nav className="category-nav-bar" aria-label="Collections">
          {activeCategoryLinks.map((c) => {
            const active = category === c.query || (!category && c.query === "");
            return (
              <Link
                key={c.name}
                href={link({ category: c.query })}
                className={`cat-link ${active ? "active" : ""}`}
              >
                {c.name}
              </Link>
            );
          })}
        </nav>

        {/* Aso-Ebi Color Palette Swatches (shown for fashion & all) */}
        {(!pillar || pillar === "fashion" || pillar === "all") && (
          <div className="color-swatches-row" aria-label="Filter by Aso-Ebi color code">
            <span className="color-label-tag">Aso-Ebi Color:</span>
            {COLORS.map((c) => {
              const active = color === c.value;
              return (
                <Link
                  key={c.value}
                  href={link({ color: active ? "" : c.value })}
                  className={`swatch-chip ${active ? "active" : ""}`}
                  aria-pressed={active}
                  title={`Filter by ${c.name}`}
                >
                  <span
                    className="swatch-circle"
                    style={{
                      backgroundColor: c.hex,
                      border: "border" in c && c.border ? "1px solid #D0D0CE" : undefined,
                    }}
                  />
                  <span>{c.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Event & Condition Filters (Clean Text Pills) */}
        <div className="sub-filters-row" aria-label="Filter by event">
          <Link href={link({ event: "" })} className={`filter-pill ${!event ? "active" : ""}`}>
            All Events
          </Link>
          {EVENTS.map((e) => (
            <Link key={e} href={link({ event: e })} className={`filter-pill ${event === e ? "active" : ""}`}>
              {e}
            </Link>
          ))}
        </div>

        <div className="sub-filters-row" aria-label="Filter by condition">
          <Link href={link({ grade: "" })} className={`filter-pill ${!grade ? "active" : ""}`}>
            Any Condition
          </Link>
          <Link href={link({ grade: "A" })} className={`filter-pill ${grade === "A" ? "active" : ""}`}>
            Grade A (Like New)
          </Link>
          <Link href={link({ grade: "B" })} className={`filter-pill ${grade === "B" ? "active" : ""}`}>
            Grade B (Gently Worn)
          </Link>
          <Link href={link({ grade: "C" })} className={`filter-pill ${grade === "C" ? "active" : ""}`}>
            Grade C (Budget)
          </Link>
        </div>
      </div>

      {/* Catalog Section Header */}
      <div className="row between" style={{ alignItems: "baseline" }}>
        <div>
          <h2>
            {q
              ? `Results for “${q}”`
              : color
              ? `${COLORS.find((c) => c.value === color)?.name ?? color} Looks`
              : category
              ? category
              : event
              ? `${event} Attire`
              : `Outfits near ${area}`}
          </h2>
          <p className="small muted">
            {items.length} {items.length === 1 ? "item" : "items"} available for this weekend
          </p>
        </div>

        {isFiltered && (
          <Link href="/" className="small muted" style={{ textDecoration: "underline" }}>
            Reset all filters
          </Link>
        )}
      </div>

      {error && (
        <p className="notice bad">
          Unable to load outfits. Please refresh or verify your connection.
        </p>
      )}

      {/* Product Grid */}
      {items.length > 0 ? (
        <div className="outfit-grid">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} area={area} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty">
            <p className="strong">No outfits match your selected filters</p>
            <p className="small muted">
              Try adjusting your search, choosing another color code, or clearing filters.
            </p>
            <Link href="/" className="btn small ghost" style={{ marginTop: 8 }}>
              Clear Filters
            </Link>
          </div>
        )
      )}

      {/* The Owambe Standard (Clean 3-Step Process) */}
      <section className="standard-section">
        <div className="standard-header">
          <span className="hero-kicker">How It Works</span>
          <h2>The Owambe Closet standard</h2>
          <p className="muted">
            High-end traditional attire rented directly between verified wardrobe owners and party guests in Lagos.
          </p>
        </div>

        <div className="standard-grid">
          <div className="standard-step">
            <span className="step-num">01 / RESERVE</span>
            <h3>Book for your event date</h3>
            <p>
              Choose your outfit and your party date. Your 3-day rental covers pickup the day before, event day, and return the following day. Your security deposit is secured via Paystack.
            </p>
          </div>

          <div className="standard-step">
            <span className="step-num">02 / COLLECT</span>
            <h3>Pick up fresh at your local hub</h3>
            <p>
              Collect from a verified partner tailor shop or boutique in Ikotun, Egbeda, or Igando (or select safe doorstep dispatch). Every seam, zipper, and bead is audited and pressed.
            </p>
          </div>

          <div className="standard-step">
            <span className="step-num">03 / RETURN</span>
            <h3>Return without dry cleaning</h3>
            <p>
              Wear it to your event and return it to the hub on Monday. We take care of professional dry cleaning and sanitization, and your deposit is refunded automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Closet Owner Callout */}
      <section className="owner-banner">
        <div>
          <h2>Monetize your wardrobe</h2>
          <p>
            Have bespoke lace or velvet Agbadas hanging unworn? Earn 70% of every rental while partner tailor hubs handle intake, storage, dry cleaning, and handovers.
          </p>
        </div>

        <Link href="/list" className="btn">
          List an Outfit (Earn 70%)
        </Link>
      </section>
    </div>
  );
}
