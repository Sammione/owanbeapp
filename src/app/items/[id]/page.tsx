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

          {/* Owner & Hub Card */}
          <div className="partner-hub-card">
            <div className="hub-avatar-circle">
              {(owner?.first_name ?? "O").slice(0, 1).toUpperCase()}
            </div>
            <div className="stack" style={{ flex: 1 }}>
              <strong className="small">
                Listed by {isOwner ? "You" : `${owner?.first_name ?? "Verified Owner"} in ${owner?.area ?? "Lagos"}`}
              </strong>
              <span className="muted tiny">
                {hub ? `Handover & return at ${hub.name} (${hub.area})` : "Pickup hub assigned upon booking"}
              </span>
            </div>
            {item.size_label && (
              <span className="pill">
                Size {item.size_label}
              </span>
            )}
          </div>

          {/* Quality & Cleanliness Guarantee */}
          {item.grade && (
            <div className="tailor-quality-card">
              <div className="tqc-title">
                <span>Tailor Hub Audit: {GRADES[item.grade].label}</span>
              </div>
              <p className="tqc-desc">
                {GRADES[item.grade].note} Inspected by professional tailors.
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

          {/* Tailor Measurements */}
          {measures.length > 0 && (
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

          {/* Interactive "Will It Fit Me?" Fit Checker */}
          {(item.bust || item.waist || item.hip) && (
            <FitChecker item={item} />
          )}

          {/* Booking or Owner Action */}
          {item.status === "live" && !isOwner ? (
            <BookingForm
              itemId={item.id}
              price={item.price}
              deposit={item.deposit}
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
            <div className="row g8">
              <span>✓</span>
              <span>
                <strong>100% Refundable Security Deposit:</strong> Returned within 24 hours of returning the garment.
              </span>
            </div>
            <div className="row g8">
              <span>✓</span>
              <span>
                <strong>Professional Dry Cleaning Included:</strong> We sanitize every piece between rentals.
              </span>
            </div>
            <div className="row g8">
              <span>✓</span>
              <span>
                <strong>Paystack Secured:</strong> Card, transfer or USSD.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
