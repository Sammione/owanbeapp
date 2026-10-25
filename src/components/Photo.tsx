import React from "react";

/** Shows an item's photo, or a fabric-pattern placeholder when there is none. */
export function Photo({
  src,
  alt,
  className = "",
  style,
  children,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={`photo ${className}`} style={style}>
      {src ? <img src={src} alt={alt} loading="lazy" /> : <div className="ph" role="img" aria-label={alt} />}
      {children}
    </div>
  );
}
