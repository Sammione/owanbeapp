import Link from "next/link";
import { Photo } from "./Photo";
import { naira } from "@/lib/format";
import { isVenueCategory, isServiceCategory } from "@/lib/constants";
import type { Item } from "@/lib/types";

export function ItemCard({
  item,
  area,
}: {
  item: Pick<Item, "id" | "title" | "price" | "photos" | "grade"> & {
    hub_area?: string | null;
    category?: string | null;
  };
  area?: string;
}) {
  const isVenue = isVenueCategory(item.category);
  const isService = isServiceCategory(item.category);
  const estimatedRetail = Math.round((item.price * (isVenue ? 1 : 6.2)) / 1000) * 1000;

  return (
    <Link href={`/items/${item.id}`} className="card" aria-label={`View ${item.title}`}>
      <div className="card-media">
        <Photo src={item.photos?.[0]} alt={item.title} />

        {item.hub_area && (
          <div className="card-tag-left">
            {item.hub_area === area ? "Near you" : item.hub_area}
          </div>
        )}

        {isVenue ? (
          <div className="card-tag-right">
            <span className="clean-grade-tag" style={{ background: "rgba(22, 83, 55, 0.9)", color: "#fff" }}>
              Verified Venue
            </span>
          </div>
        ) : item.grade ? (
          <div className="card-tag-right">
            <span className={`clean-grade-tag ${item.grade}`}>
              Grade {item.grade}
            </span>
          </div>
        ) : null}
      </div>

      <div className="card-details">
        <div className="row between" style={{ alignItems: "center", marginBottom: 2 }}>
          <div className="card-category">
            {item.category ?? "Owambe Look"}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#D4AF37", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
            <span>★</span>
            <span style={{ color: "var(--ink)" }}>4.9</span>
          </span>
        </div>

        <h3 className="card-title">{item.title}</h3>

        <div className="card-price-line">
          <span className="card-price-val">{naira(item.price)}</span>
          <span className="card-price-period">
            {isVenue ? "/ event day" : isService ? "/ event" : "/ 3 days"}
          </span>
          {!isVenue && (
            <span className="card-retail-val">{naira(estimatedRetail)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
