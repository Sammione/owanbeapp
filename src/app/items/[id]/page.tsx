import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { GRADES } from "@/lib/constants";
import { naira, niceDate } from "@/lib/format";
import type { Item, Hub } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { Gallery } from "./Gallery";
import { BookingForm } from "./BookingForm";
import { SaveButton } from "./SaveButton";
import { FitChecker } from "@/components/FitChecker";

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user, profile } = await getUserAndProfile();

  const { data: item } = await supabase.from("items").select("*").eq("id", id).maybeSingle<Item>();
  if (!item) notFound();

  const [{ data: owner }, { data: hub }, { data: busy }, saved] = await Promise.all([
    supabase.from("owner_public").select("first_name,area").eq("id", item.owner_id).maybeSingle(),
    item.hub_id ? supabase.from("hubs").select("*").eq("id", item.hub_id).maybeSingle<Hub>() : Promise.resolve({ data: null }),
    supabase.rpc("item_busy_ranges", { p_item: item.id }),
    user ? supabase.from("saved").select("item_id").eq("user_id", user.id).eq("item_id", item.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const isOwner = user?.id === item.owner_id;
  const staff = !!profile && ["hub", "admin"].includes(profile.role);
  const measures = (
    [
      ["Bust", item.bust],
      ["Waist", item.waist],
      ["Hip", item.hip],
      ["Length", item.length],
      ["Sleeve", item.sleeve],
    ] as const
  ).filter(([, v]) => v != null);

  const estimatedRetail = Math.round((item.price * 6.2) / 1000) * 1000;

  return (
    <div className="container">
      {/* Top action row */}
      <div className="row between">
        <Link href="/" className="iconbtn" aria-label="Back to outfits">
          <Icon name="back" stroke={2} />
        </Link>
        <div className="row g10">
          <SaveButton itemId={item.id} initial={!!saved.data} signedIn={!!user} />
        </div>
      </div>

      {sp.cancelled && (
        <div className="notice warn">
          Payment was not completed. You can adjust your dates or try again below.
        </div>
      )}

      {item.status !== "live" && (
        <div className="notice warn">
          Listing status: <strong>{item.status}</strong>
          {item.status === "pending" && ". The hub will inspect, clean and grade this outfit before making it live."}
          {item.status === "rejected" && item.rejection_reason && `: ${item.rejection_reason}`}
        </div>
      )}

      <div className="item-layout-grid">
        {/* Left Column: Gallery */}
        <div className="item-gallery-wrap">
          <Gallery photos={item.photos} title={item.title} />
        </div>

        {/* Right Column: Editorial Product Details & Booking */}
        <div className="item-info-stack">
          <div className="item-header-block">
            <div className="item-badges-bar">
              {item.grade && (
                <span className={`clean-grade-tag ${item.grade}`}>
                  Grade {item.grade} · {GRADES[item.grade].label}
                </span>
              )}
              {item.quality === "premium" && (
                <span className="pill">
                  Premium Fabric
                </span>
              )}
              <span className="pill">
                {item.category}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(24px, 3.2vw, 36px)", lineHeight: 1.15 }}>
              {item.title}
            </h1>

            {/* Price Banner */}
            <div className="item-price-banner">
              <span className="price-naira">{naira(item.price)}</span>
              <span className="price-sub">/ 3-day rental</span>
              <span className="price-anchor">
                Est. Retail {naira(estimatedRetail)}
              </span>
            </div>
          </div>

          {/* Verified Anonymous Partner & Hub Card */}
          <div className="partner-hub-card">
            <div className="hub-avatar-circle" style={{ background: "rgba(212, 175, 55, 0.12)", color: "#D4AF37", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
              <Icon name="shield" size={18} stroke={2.2} />
            </div>
            <div className="stack" style={{ flex: 1 }}>
              <div className="row g6" style={{ alignItems: "center" }}>
                <strong className="small">
                  {isOwner ? "Your Listing (Private Wardrobe)" : "Verified Owambe Partner · Lagos"}
                </strong>
              </div>
              <span className="muted tiny">
                {hub ? `Intermediated & sanitized at ${hub.name} (${hub.area})` : "Handover managed via verified partner hub"}
              </span>
              {!isOwner && (
                <span className="tiny" style={{ color: "var(--accent, #D4AF37)", opacity: 0.9 }}>
                  Verified anonymous transaction · Zero direct party contact
                </span>
              )}
            </div>
            {item.size_label && (
              <span className="pill">
                {item.category === "Shoes & Footwear" ? item.size_label : `Size ${item.size_label}`}
              </span>
            )}
          </div>

          {/* Quality & Cleanliness Guarantee */}
          {item.grade && (
            <div className="tailor-quality-card">
              <div className="tqc-title">
                <span>{item.category === "Shoes & Footwear" ? "Hub Footwear Audit" : "Tailor Hub Audit"}: {GRADES[item.grade].label}</span>
              </div>
              <p className="tqc-desc">
                {GRADES[item.grade].note} Inspected by professional staff.
                {item.cleaned_at && ` Hospital-grade sanitized on ${niceDate(item.cleaned_at)}.`}
              </p>
            </div>
          )}

          {item.description && (
            <div className="stack g6">
              <span className="label">About this look</span>
              <p className="muted" style={{ lineHeight: 1.6 }}>{item.description}</p>
            </div>
          )}

          {item.pieces && (
            <div className="row g8 small">
              <strong style={{ flex: "none" }}>Includes:</strong>
              <span className="muted">{item.pieces}</span>
            </div>
          )}

          {/* Footwear & Fit Specifications */}
          {item.category === "Shoes & Footwear" && (
            <div className="measurement-box">
              <div className="row between">
                <div className="row g8" style={{ alignItems: "center" }}>
                  <Icon name="shoe" size={20} stroke={2} />
                  <h3 style={{ margin: 0 }}>Footwear Specifications</h3>
                </div>
                <span className="tiny muted">Audited Fit</span>
              </div>
              <div className="grid2" style={{ gap: 10, marginTop: 10 }}>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">Shoe Size</span>
                  <strong style={{ fontSize: 16 }}>{item.size_label?.split("·")[0]?.trim() || item.size_label || "Standard"}</strong>
                </div>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">Heel / Sole Height</span>
                  <strong style={{ fontSize: 16 }}>{item.size_label?.split("·")[1]?.trim() || "Event Standard"}</strong>
                </div>
              </div>
              <div className="tailor-quality-card" style={{ marginTop: 10, background: "rgba(255, 255, 255, 0.03)" }}>
                <div className="tqc-title">
                  <span>Footwear Hygiene & Sole Check</span>
                </div>
                <p className="tqc-desc">
                  Soles, heel tips, and inner footbeds inspected by hub specialists. Hospital-grade UV sanitized and delivered with protective dustbag.
                </p>
              </div>
            </div>
          )}

          {/* Equipment Specifications (Coolers, Pots, Warmers, Chairs) */}
          {(["Coolers & Ice Chests", "Cooking Pots & Burners", "Chafing Dishes & Food Warmers", "Canopies, Tables & Chairs", "Generators & Sound Systems"] as const).includes(item.category as any) && (
            <div className="measurement-box">
              <div className="row between">
                <div className="row g8" style={{ alignItems: "center" }}>
                  <Icon name="box" size={20} stroke={2} />
                  <h3 style={{ margin: 0 }}>Equipment Specifications</h3>
                </div>
                <span className="tiny muted">Audited Hardware</span>
              </div>
              <div className="grid2" style={{ gap: 10, marginTop: 10 }}>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">Capacity / Volume</span>
                  <strong style={{ fontSize: 16 }}>{item.size_label || "Industrial Standard"}</strong>
                </div>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">Fleet Condition</span>
                  <strong style={{ fontSize: 16 }}>Grade {item.grade ?? "A"} · Fully Tested</strong>
                </div>
              </div>
              <div className="tailor-quality-card" style={{ marginTop: 10, background: "rgba(255, 255, 255, 0.03)" }}>
                <div className="tqc-title">
                  <span>Hygiene, Burner & Seal Inspection</span>
                </div>
                <p className="tqc-desc">
                  Oil-free degreased, pressure-tested seals and valves, and UV sanitized before dispatch. Delivered in ready-to-use condition.
                </p>
              </div>
            </div>
          )}

          {/* Catering & Event Service Specifications */}
          {(["Party Catering & Jollof", "Small Chops & Finger Foods", "Cocktails & Drinks Bar", "Event Ushers & Protocol"] as const).includes(item.category as any) && (
            <div className="measurement-box">
              <div className="row between">
                <div className="row g8" style={{ alignItems: "center" }}>
                  <Icon name="utensils" size={20} stroke={2} />
                  <h3 style={{ margin: 0 }}>Service Package Details</h3>
                </div>
                <span className="tiny" style={{ color: "var(--grade-a, #165337)", fontWeight: 600 }}>Verified Caterer / Vendor</span>
              </div>
              <div className="grid2" style={{ gap: 10, marginTop: 10 }}>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">Guest Capacity</span>
                  <strong style={{ fontSize: 16 }}>{item.size_label || "100 Guests Standard"}</strong>
                </div>
                <div className="field box" style={{ padding: 12 }}>
                  <span className="tiny muted">On-Site Arrival</span>
                  <strong style={{ fontSize: 16 }}>2 Hours Before Event</strong>
                </div>
              </div>
              <div className="tailor-quality-card" style={{ marginTop: 10, background: "rgba(22, 83, 55, 0.08)", borderColor: "rgba(22, 83, 55, 0.2)" }}>
                <div className="tqc-title">
                  <span style={{ color: "var(--grade-a, #165337)" }}>Paystack Escrow Protection</span>
                </div>
                <p className="tqc-desc" style={{ color: "var(--ink-secondary)" }}>
                  Your payment is safely held by Owambe Closet. The caterer / vendor is only paid after your event is successfully delivered to your satisfaction.
                </p>
              </div>
            </div>
          )}

          {/* Tailor Measurements for Garments */}
          {item.category !== "Shoes & Footwear" &&
            !(["Coolers & Ice Chests", "Cooking Pots & Burners", "Chafing Dishes & Food Warmers", "Canopies, Tables & Chairs", "Generators & Sound Systems", "Party Catering & Jollof", "Small Chops & Finger Foods", "Cocktails & Drinks Bar", "Event Ushers & Protocol"] as const).includes(item.category as any) &&
            measures.length > 0 && (
            <div className="measurement-box">
              <div className="row between">
                <h3>Tailor Measurements</h3>
                <span className="tiny muted">Audited inches</span>
              </div>
              <table className="measure-table">
                <tbody>
                  {measures.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}″</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <span className="hint">
                Compare with an outfit in your closet that fits you comfortably. No cutting or pin alterations allowed.
              </span>
            </div>
          )}

          {/* Interactive "Will It Fit Me?" Fit Checker (Garments only) */}
          {!(["Coolers & Ice Chests", "Cooking Pots & Burners", "Chafing Dishes & Food Warmers", "Canopies, Tables & Chairs", "Generators & Sound Systems", "Party Catering & Jollof", "Small Chops & Finger Foods", "Cocktails & Drinks Bar", "Event Ushers & Protocol", "Shoes & Footwear"] as const).includes(item.category as any) &&
            (item.bust || item.waist || item.hip) && (
            <FitChecker item={item} />
          )}

          {/* Booking or Owner Action */}
          {item.status === "live" && !isOwner ? (
            <BookingForm
              itemId={item.id}
              title={item.title}
              photos={item.photos}
              sizeLabel={item.size_label}
              price={item.price}
              deposit={item.deposit}
              category={item.category}
              hubName={hub?.name ?? "the neighborhood hub"}
              busy={(busy ?? []) as { start_date: string; end_date: string }[]}
              signedIn={!!user}
            />
          ) : isOwner ? (
            <Link href="/me?tab=listings" className="btn ghost block">
              Manage in My Listings
            </Link>
          ) : staff ? (
            <Link href={`/hub/items/${item.id}`} className="btn dark block">
              Open Hub Inspection Desk
            </Link>
          ) : null}

          {/* Trust Footnotes */}
          <div className="stack g8 small muted" style={{ paddingTop: 8 }}>
            <div className="row g8" style={{ alignItems: "flex-start" }}>
              <span style={{ color: "var(--grade-a)", marginTop: 2 }}>
                <Icon name="check" size={14} stroke={2.5} />
              </span>
              <span>
                <strong>Refundable Security Deposit:</strong> Returned within 24 hours of item inspection.
              </span>
            </div>
            <div className="row g8" style={{ alignItems: "flex-start" }}>
              <span style={{ color: "var(--grade-a)", marginTop: 2 }}>
                <Icon name="check" size={14} stroke={2.5} />
              </span>
              <span>
                <strong>Professional Sanitization Included:</strong> Cleaned and audited between rentals.
              </span>
            </div>
            <div className="row g8" style={{ alignItems: "flex-start" }}>
              <span style={{ color: "var(--grade-a)", marginTop: 2 }}>
                <Icon name="check" size={14} stroke={2.5} />
              </span>
              <span>
                <strong>Paystack Secured:</strong> Instant card, bank transfer or USSD.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
