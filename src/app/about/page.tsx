import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = {
  title: "About Us | owambeFit – Lagos",
  description:
    "Learn about owambeFit, founded by Olokunlade Olayemi Jadesola and Omolaiye Samuel Oluwatobi. A Lagos rental marketplace for traditional fashion, event halls, and celebration essentials.",
};

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Editorial Header */}
      <section className="about-hero-clean">
        <div className="about-hero-container">
          <h1 className="about-title-clean">
            Rent luxury traditional wear.
            <br />
            Monetize your wardrobe.
          </h1>
          <p className="about-lead-clean">
            owambeFit is a Lagos marketplace that connects guests attending parties and weddings with verified traditional attire, celebration venues, and party equipment.
          </p>

          <div className="about-actions-clean">
            <Link href="/" className="btn primary">
              Browse Outfits
            </Link>
            <Link href="/list" className="btn ghost">
              List Your Outfits (Earn 70%)
            </Link>
          </div>
        </div>
      </section>

      {/* Facts Bar */}
      <section className="about-facts-bar">
        <div className="about-facts-inner">
          <div className="fact-item">
            <span className="fact-title">3-Day Rental</span>
            <span className="fact-sub">Pick up Friday, return Monday</span>
          </div>
          <div className="fact-item">
            <span className="fact-title">Dry-Cleaned</span>
            <span className="fact-sub">Sanitized at neighborhood hubs</span>
          </div>
          <div className="fact-item">
            <span className="fact-title">Paystack Escrow</span>
            <span className="fact-sub">Refundable security deposits</span>
          </div>
          <div className="fact-item">
            <span className="fact-title">70% Owner Payout</span>
            <span className="fact-sub">Direct NUBAN bank transfer</span>
          </div>
        </div>
      </section>

      {/* Origin & Why We Started */}
      <section className="about-article-section">
        <div className="about-article-container">
          <h2>Why we started owambeFit</h2>
          <div className="about-prose">
            <p>
              In Lagos, traditional events are an integral part of weekend life. Whether it is an intimate engagement, a church wedding, a milestone birthday, or a grand burial reception, people want to dress well and celebrate with family.
            </p>
            <p>
              However, buying 5 yards of bespoke lace or high-grade guinea brocade, looking for a reliable tailor, and paying ₦50,000 to ₦150,000 for each event becomes financially unsustainable. The resulting garments are often worn for only four or five hours on a Saturday afternoon and then spend years hanging inside a wardrobe.
            </p>
            <p>
              We built owambeFit to give people a straightforward alternative: rent clean, audited traditional outfits for a fraction of the cost of tailoring a new one. At the same time, people with quality clothes hanging in their closets can put them to work and earn recurring income.
            </p>
          </div>
        </div>
      </section>

      {/* Meet The Founders */}
      <section className="about-founders-clean">
        <div className="about-article-container">
          <h2>Meet the founders</h2>
          <p className="muted" style={{ marginBottom: 32, fontSize: "1.05rem", lineHeight: 1.6 }}>
            One of us makes sure the outfit is beautiful. The other makes sure the rental is smooth and safe. Together, we make owambe dressing easy.
          </p>

          <div className="founders-clean-grid">
            {/* Olokunlade Olayemi Jadesola */}
            <div className="founder-clean-card">
              <div className="founder-clean-header">
                <div className="founder-initials-badge">OJ</div>
                <div>
                  <h3 className="founder-clean-name">Olokunlade Olayemi Jadesola</h3>
                  <span className="founder-clean-role">Co-Founder, Style and Quality</span>
                </div>
              </div>
              <div className="founder-clean-body">
                <p>
                  Jadesola’s background is in fashion styling and occasion wear, so she knows what a great owambe outfit looks like up close. She leads our brand, works with our partner tailors, and makes sure every piece is clean, well finished and ready to wear. Samuel keeps the rental process behind it simple and safe.
                </p>
              </div>
              <div className="founder-focus-tags">
                <span>Outfit quality</span>
                <span>Styling and fit</span>
                <span>Partner tailors</span>
              </div>
            </div>

            {/* Omolaiye Samuel Oluwatobi */}
            <div className="founder-clean-card">
              <div className="founder-clean-header">
                <div className="founder-initials-badge samuel-badge">SO</div>
                <div>
                  <h3 className="founder-clean-name">Omolaiye Samuel Oluwatobi</h3>
                  <span className="founder-clean-role">Co-Founder, Payments and Partnerships</span>
                </div>
              </div>
              <div className="founder-clean-body">
                <p>
                  Samuel makes sure renting on owambeFit feels safe and simple. He looks after bookings, payments and refunds, so renters know their money is protected and owners know they’ll be paid. He works alongside Jadesola so every outfit she approves reaches you through a smooth, trusted process.
                </p>
              </div>
              <div className="founder-focus-tags">
                <span>Secure payments</span>
                <span>Easy booking</span>
                <span>Hub pickup</span>
              </div>
            </div>
          </div>

          {/* Together closing note */}
          <div className="founders-together-box">
            <span className="together-label">Together</span>
            <p className="together-text">
              Jadesola brings the style and standards. Samuel brings the systems and trust. We started owambeFit so you can look your best at every owambe without buying an outfit you’ll wear once.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works in Practice */}
      <section className="about-steps-section">
        <div className="about-article-container">
          <h2>How it works</h2>
          <div className="about-steps-grid">
            <div className="step-card-clean">
              <span className="step-number">1</span>
              <h3>Choose your look and event date</h3>
              <p>
                Browse verified Aso-ebi, Agbada, Gele, and shoes. Pick your event date; your 3-day rental covers pickup the day before and return the day after.
              </p>
            </div>

            <div className="step-card-clean">
              <span className="step-number">2</span>
              <h3>Pick up at a local hub</h3>
              <p>
                Collect your pressed and steam-sanitized outfit from a partner tailor boutique in Ikotun, Egbeda, or Igando (or select doorstep dispatch).
              </p>
            </div>

            <div className="step-card-clean">
              <span className="step-number">3</span>
              <h3>Return on Monday</h3>
              <p>
                Wear it to your event and return it to the hub on Monday. We take care of dry cleaning, and your security deposit is released automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Hubs & Operations */}
      <section className="about-hubs-section">
        <div className="about-article-container">
          <div className="hubs-card-clean">
            <div className="hubs-info">
              <span className="section-eyebrow">PHYSICAL TOUCHPOINTS</span>
              <h3>Neighborhood Partner Hubs</h3>
              <p>
                To avoid awkward meetings between strangers, handovers and inspections happen exclusively at verified local tailor shops and fashion boutiques across Lagos:
              </p>
              <ul className="hubs-list">
                <li><strong>Ikotun Hub:</strong> Ikotun Roundabout / Governors Road</li>
                <li><strong>Egbeda Hub:</strong> Akowonjo Road / Egbeda Bus Stop</li>
                <li><strong>Igando Hub:</strong> LASU-Iba Road / Igando</li>
              </ul>
            </div>
            <div className="hubs-contact-box">
              <h4>Questions or custom inquiry?</h4>
              <p className="tiny muted">
                Speak directly with our team regarding rental availability, hall bookings, or listing your wardrobe.
              </p>
              <div className="stack g8" style={{ marginTop: 16 }}>
                <a
                  href="https://wa.me/2348033221100"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn small block"
                  style={{ background: "#25D366", color: "#fff", borderColor: "#25D366", textAlign: "center" }}
                >
                  WhatsApp Support (+234 803 322 1100)
                </a>
                <Link href="/" className="btn ghost small block" style={{ textAlign: "center" }}>
                  Explore Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
