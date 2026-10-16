"use client";
import { useState } from "react";
import { Photo } from "@/components/Photo";

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <Photo src={photos[i]} alt={`${title}, photo ${i + 1}`} />
      {photos.length > 1 && (
        <div className="thumbs" role="group" aria-label="Photos">
          {photos.map((p, n) => (
            <button key={p} aria-pressed={n === i} aria-label={`Show photo ${n + 1}`} onClick={() => setI(n)}>
              <img src={p} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
