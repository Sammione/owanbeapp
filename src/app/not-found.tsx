import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container narrow">
      <h1>Page not found</h1>
      <p className="muted">That outfit may have been removed, or the link is wrong.</p>
      <Link href="/" className="btn">Browse outfits</Link>
    </div>
  );
}
