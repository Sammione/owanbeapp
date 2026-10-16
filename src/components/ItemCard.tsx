import Link from "next/link";
import { Photo } from "./Photo";
import { naira } from "@/lib/format";
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
  const estimatedRetail = Math.round((item.price * 6.2) / 1000) * 1000;

  return (
    <Link href={`/items/${item.id}`} className="card" aria-label={`View ${item.title}`}>
      <div className="card-media">
        <Photo src={item.photos?.[0]} alt={item.title} />

        {item.hub_area && (
          <div className="card-tag-left">
            {item.hub_area === area ? "Near you" : item.hub_area}
          </div>
        )}

        {item.grade && (
          <div className="card-tag-right">
            <span className={`clean-grade-tag ${item.grade}`}>
              Grade {item.grade}
            </span>
          </div>
        )}
      </div>

      <div className="card-details">
        <div className="card-category">
          {item.category ?? "Owambe Look"}
        </div>

        <h3 className="card-title">{item.title}</h3>

        <div className="card-price-line">
          <span className="card-price-val">{naira(item.price)}</span>
          <span className="card-price-period">/ 3 days</span>
          <span className="card-retail-val">{naira(estimatedRetail)}</span>
        </div>
      </div>
    </Link>
  );
}
