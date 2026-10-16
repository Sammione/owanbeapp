/** Shows an item's photo, or a fabric-pattern placeholder when there is none. */
export function Photo({ src, alt, className = "", children }: { src?: string | null; alt: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`photo ${className}`}>
      {src ? <img src={src} alt={alt} loading="lazy" /> : <div className="ph" role="img" aria-label={alt} />}
      {children}
    </div>
  );
}
