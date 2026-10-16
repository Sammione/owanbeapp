import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav, TopLinks } from "@/components/NavLinks";
import { getUserAndProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Owambe Closet – Luxury Traditional Attire Rental | Lagos",
  description:
    "Rent bespoke Aso-ebi, Agbada, pre-tied Gele, and royal coral beads across Ikotun, Egbeda, and Igando. Inspected and dry-cleaned at neighborhood hubs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0e" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile();
  const staff = !!profile && ["hub", "admin"].includes(profile.role);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand-logo" aria-label="Owambe Closet Home">
              <span className="brand-name">OWAMBE CLOSET</span>
              <span className="brand-dot">.</span>
            </Link>

            <TopLinks signedIn={!!user} staff={staff} />

            {!user ? (
              <Link href="/login" className="btn small ghost" data-mobile-only>
                Sign in
              </Link>
            ) : (
              <Link href="/me?tab=profile" className="btn small ghost" data-mobile-only>
                Account
              </Link>
            )}
          </header>

          <main id="main-content">{children}</main>

          <footer className="luxury-footer">
            <div className="footer-top">
              <div className="footer-brand">
                <span className="brand-name">OWAMBE CLOSET</span>
                <p className="footer-tagline">
                  A peer-to-peer wardrobe sharing marketplace for Lagos, Nigeria. Every outfit is audited, graded, and hospital-grade sanitized by partner tailor shops and boutiques.
                </p>
                <p className="small muted">
                  Partner Hubs: Ikotun Roundabout · Akowonjo Road, Egbeda · LASU-Iba Road, Igando
                </p>
              </div>

              <div className="footer-cols">
                <div className="footer-col">
                  <h4>Collections</h4>
                  <Link href="/?category=Aso-ebi+%2F+lace">Aso-ebi & Lace</Link>
                  <Link href="/?category=Agbada">Regal Agbada</Link>
                  <Link href="/?category=Gele">Auto-Gele</Link>
                  <Link href="/?category=Beads+%26+jewelry">Royal Coral Beads</Link>
                  <Link href="/?category=Ankara">Ankara Couture</Link>
                </div>
                <div className="footer-col">
                  <h4>Owners</h4>
                  <Link href="/list">List an Outfit (Earn 70%)</Link>
                  <Link href="/me?tab=listings">Manage Listings</Link>
                  <Link href="/me?tab=rentals">Rental Payouts</Link>
                  <Link href="/login">Hub Inquiries</Link>
                </div>
                <div className="footer-col">
                  <h4>Guarantees</h4>
                  <p className="small muted">Tailor Quality Audit</p>
                  <p className="small muted">Dry Cleaning Included</p>
                  <p className="small muted">Paystack Automated Refund</p>
                  <p className="small muted">Doorstep Delivery Option</p>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="copyright">
                © {new Date().getFullYear()} Owambe Closet. Lagos, Nigeria.
              </span>
              <span className="paystack-badge">
                Payments & Automated Refunds powered by Paystack
              </span>
            </div>
          </footer>
        </div>

        <BottomNav staff={staff} />
      </body>
    </html>
  );
}
