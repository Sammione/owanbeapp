"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { CartButton } from "./CartButton";

export function TopLinks({ signedIn, staff }: { signedIn: boolean; staff: boolean }) {
  const path = usePathname();
  const on = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  return (
    <nav className="toplinks" aria-label="Main">
      <Link href="/" className={on("/") ? "active" : ""}>Explore</Link>
      <Link href="/bundles" className={on("/bundles") ? "active" : ""} style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
        ✨ Bundles (15% Off)
      </Link>
      <Link href="/about" className={on("/about") ? "active" : ""}>About Us</Link>
      <Link href="/me" className={on("/me") ? "active" : ""}>My account</Link>
      {staff && <Link href="/hub" className={on("/hub") ? "active" : ""}>Hub</Link>}
      <Link href="/list" className="btn small">List item</Link>
      <CartButton />
      {!signedIn ? (
        <Link href="/login" className={on("/login") ? "active" : ""}>Sign in</Link>
      ) : (
        <form action="/auth/signout" method="post" style={{ display: "inline-flex", margin: 0, padding: 0 }}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-muted)",
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.88rem",
              padding: "4px 8px",
            }}
          >
            Sign out
          </button>
        </form>
      )}
    </nav>
  );
}

export function BottomNav({ staff }: { staff: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "Explore", icon: "explore", match: (p: string) => p === "/" || p.startsWith("/items") },
    { href: "/me?mode=renter&tab=saved", label: "Saved", icon: "heart", match: () => false },
    { href: "/list", label: "List", icon: "plus", plus: true, match: (p: string) => p.startsWith("/list") },
    { href: "/me?mode=renter&tab=rentals", label: "Rentals", icon: "cal", match: (p: string) => p.startsWith("/me") || p.startsWith("/bookings") },
    staff
      ? { href: "/hub", label: "Hub", icon: "hub", match: (p: string) => p.startsWith("/hub") }
      : { href: "/me?mode=renter&tab=profile", label: "Account", icon: "user", match: () => false },
  ];
  return (
    <nav className="bottomnav" aria-label="Main">
      {items.map((it) =>
        it.plus ? (
          <Link key={it.href} href={it.href} className="plus" aria-label="List an outfit or shoes">
            <Icon name="plus" size={24} stroke={2.4} />
          </Link>
        ) : (
          <Link key={it.href} href={it.href} className={it.match(path) ? "active" : ""} aria-current={it.match(path) ? "page" : undefined}>
            <Icon name={it.icon} size={22} />
            {it.label}
          </Link>
        )
      )}
    </nav>
  );
}

