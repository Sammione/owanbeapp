import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav, TopLinks } from "@/components/NavLinks";
import { getUserAndProfile } from "@/lib/auth";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/CartDrawer";
import { CartButton } from "@/components/CartButton";
import { SupportWidget } from "@/components/SupportWidget";

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
        <CartProvider>
          <div className="shell">
            <header className="topbar">
              <Link href="/" className="brand-logo" aria-label="Owambe Closet Home">
                <span className="brand-name">OWAMBE CLOSET</span>
                <span className="brand-dot">.</span>
              </Link>

              <TopLinks signedIn={!!user} staff={staff} />

              <div className="row g8" style={{ alignItems: "center" }} data-mobile-only>
                <CartButton />
                {!user ? (
                  <Link href="/login" className="btn small ghost">
                    Sign in
                  </Link>
                ) : (
                  <Link href="/me?tab=profile" className="btn small ghost">
                    Account
                  </Link>
                )}
              </div>
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
                  <h4>Attire & Footwear</h4>
                  <Link href="/?pillar=fashion&category=Aso-ebi+%2F+lace">Aso-ebi & Lace</Link>
                  <Link href="/?pillar=fashion&category=Agbada">Regal Agbada</Link>
                  <Link href="/?pillar=fashion&category=Shoes+%26+Footwear">Shoes & Footwear</Link>
                  <Link href="/?pillar=fashion&category=Gele">Auto-Gele & Beads</Link>
                </div>
                <div className="footer-col">
                  <h4>Equipment & Catering</h4>
                  <Link href="/?pillar=equipment&category=Coolers+%26+Ice+Chests">Coolers & Ice Chests</Link>
                  <Link href="/?pillar=equipment&category=Cooking+Pots+%26+Burners">Cast-Iron Party Pots</Link>
                  <Link href="/?pillar=services&category=Party+Catering+%26+Jollof">Party Catering & Jollof</Link>
                  <Link href="/?pillar=equipment&category=Chafing+Dishes+%26+Food+Warmers">Chafing Dishes</Link>
                </div>
                <div className="footer-col">
                  <h4>Partners & Vendors</h4>
                  <Link href="/list">List Attire or Shoes (70%)</Link>
                  <Link href="/list">List Coolers & Pots (80%)</Link>
                  <Link href="/vendors/register">Vendor & Caterer Onboarding</Link>
                  <Link href="/me?mode=lender&tab=bank">Payout Bank Setup</Link>
                </div>
                <div className="footer-col">
                  <h4>Platform Guarantees</h4>
                  <p className="small muted">Hub Quality & Hygiene Audit</p>
                  <p className="small muted">Heavy-Duty Van Delivery</p>
                  <p className="small muted">Paystack Escrow Protection</p>
                  <p className="small muted">100% Anonymous Transactions</p>
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
          <CartDrawer />
          <SupportWidget />
        </CartProvider>
      </body>
    </html>
  );
}
