"use client";
import React, { useState } from "react";
import { Icon } from "@/components/Icon";

const WHATSAPP_NUMBER = "2348120628065";
const DISPLAY_PHONE = "+234 812 062 8065";

type IssueCategory =
  | "deposit"
  | "delivery"
  | "fitting"
  | "condition"
  | "general";

const CATEGORIES: { id: IssueCategory; label: string; desc: string }[] = [
  {
    id: "deposit",
    label: "Security Deposit Refund",
    desc: "Check status of your 100% deposit return after event",
  },
  {
    id: "delivery",
    label: "Delivery / Dispatch Delay",
    desc: "Locate van or bike dispatch rider for your outfit/equipment",
  },
  {
    id: "fitting",
    label: "Fitting / Size Swap Request",
    desc: "Attire or footwear needs size exchange at partner hub",
  },
  {
    id: "condition",
    label: "Item Condition / Defect Report",
    desc: "Report a stain, defect or missing accessory upon receipt",
  },
  {
    id: "general",
    label: "General Inquiry / Event Booking",
    desc: "Custom package, corporate events or partnership",
  },
];

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"complaint" | "faq">("complaint");
  const [category, setCategory] = useState<IssueCategory>("deposit");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const catObj = CATEGORIES.find((c) => c.id === category);

    const ticketLines = [
      `*OWANBEFIT — SUPPORT & COMPLAINT TICKET*`,
      `------------------------------------------`,
      `*Issue Type:* ${catObj?.label || "General Issue"}`,
      name ? `*Customer Name:* ${name}` : null,
      phone ? `*Phone Number:* ${phone}` : null,
      bookingRef ? `*Booking / Item Ref:* ${bookingRef}` : null,
      `*Details:*`,
      details.trim() || "Customer requested immediate support via website.",
      `------------------------------------------`,
      `_Submitted from OwanbeFit Platform_`,
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      ticketLines
    )}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setDetails("");
    }, 2500);
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className="support-floating-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open Customer Support & Complaints Desk"
      >
        <span className="support-pulse-dot" aria-hidden="true" />
        <Icon name="support" size={17} stroke={2.2} />
        <span className="support-btn-text">Support Desk</span>
      </button>

      {/* Support Drawer / Modal */}
      {isOpen && (
        <div
          className="support-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Customer Support Desk"
        >
          <div
            className="support-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="support-header">
              <div>
                <div className="row g6" style={{ alignItems: "center" }}>
                  <span className="support-pulse-dot" style={{ position: "static" }} />
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                    OwanbeFit Support &amp; Help Desk
                  </h3>
                </div>
                <p className="tiny muted" style={{ margin: "2px 0 0" }}>
                  Direct WhatsApp hotline: {DISPLAY_PHONE}
                </p>
              </div>
              <button
                type="button"
                className="iconbtn"
                onClick={() => setIsOpen(false)}
                aria-label="Close support desk"
                style={{ width: 34, height: 34 }}
              >
                <Icon name="x" size={16} stroke={2.2} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="support-tabs-bar">
              <button
                type="button"
                className={`support-tab-btn ${tab === "complaint" ? "active" : ""}`}
                onClick={() => setTab("complaint")}
              >
                Log an Issue / Complaint
              </button>
              <button
                type="button"
                className={`support-tab-btn ${tab === "faq" ? "active" : ""}`}
                onClick={() => setTab("faq")}
              >
                Instant Answers (FAQs)
              </button>
            </div>

            {/* Tab 1: Complaint Form */}
            {tab === "complaint" ? (
              <form onSubmit={handleSubmit} className="support-content-scroll">
                {submitted ? (
                  <div className="support-success-box">
                    <div className="support-success-icon">
                      <Icon name="check" size={24} stroke={2.5} />
                    </div>
                    <h4>Ticket Created &amp; Opened on WhatsApp</h4>
                    <p className="small muted">
                      Our support team will reply on WhatsApp directly. Thank you for your patience!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label className="tiny-label">Select Issue Category *</label>
                      <div className="support-cat-grid">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            className={`support-cat-card ${
                              category === cat.id ? "active" : ""
                            }`}
                            onClick={() => setCategory(cat.id)}
                          >
                            <strong>{cat.label}</strong>
                            <small>{cat.desc}</small>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="row g8">
                      <div className="field" style={{ flex: 1 }}>
                        <label htmlFor="sup-name" className="tiny-label">
                          Your Name (Optional)
                        </label>
                        <input
                          id="sup-name"
                          type="text"
                          className="input small"
                          placeholder="e.g. Tunde Adeleke"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label htmlFor="sup-phone" className="tiny-label">
                          Your Phone (Optional)
                        </label>
                        <input
                          id="sup-phone"
                          type="tel"
                          className="input small"
                          placeholder="0803 000 0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="sup-ref" className="tiny-label">
                        Booking Reference or Item Name (Optional)
                      </label>
                      <input
                        id="sup-ref"
                        type="text"
                        className="input small"
                        placeholder="e.g. OWC-CART-9821 or Velvet Agbada"
                        value={bookingRef}
                        onChange={(e) => setBookingRef(e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="sup-details" className="tiny-label">
                        Explain Your Complaint / Issue *
                      </label>
                      <textarea
                        id="sup-details"
                        className="input small"
                        rows={3}
                        required
                        placeholder="Please describe what happened so our team can resolve it immediately..."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                    </div>

                    <div className="support-wa-banner">
                      <Icon name="chat" size={18} stroke={2} />
                      <span className="tiny">
                        When you submit, this ticket will open in WhatsApp and ping our manager instantly.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn block"
                      style={{ height: 46, fontSize: "0.92rem", marginTop: 4 }}
                    >
                      Open WhatsApp Support Ticket →
                    </button>
                  </>
                )}
              </form>
            ) : (
              /* Tab 2: Instant Answers */
              <div className="support-content-scroll">
                <div className="support-faq-item">
                  <h4>When will my security deposit refund drop?</h4>
                  <p className="small muted">
                    Your 100% security deposit is released automatically via Paystack within 24 hours of returning the attire, shoes, or equipment to your partner hub (Ikotun, Egbeda, or Igando) once sanitized and inspected.
                  </p>
                </div>

                <div className="support-faq-item">
                  <h4>The attire or shoes don’t fit—can I swap?</h4>
                  <p className="small muted">
                    Yes! You can visit your designated partner hub up to 24 hours prior to your event celebration to exchange for an alternative available size or design.
                  </p>
                </div>

                <div className="support-faq-item">
                  <h4>What if an outfit gets stained at the party?</h4>
                  <p className="small muted">
                    Don’t panic! Routine party spills, sweat, and light dust are 100% covered by our hub hospital-grade dry cleaning audit. You are NOT charged for normal wear. Only major burns, severe dye tears, or unreturned items affect deposits.
                  </p>
                </div>

                <div className="support-faq-item">
                  <h4>Urgent weekend delivery assistance</h4>
                  <p className="small muted">
                    For Saturday/Sunday wedding emergencies, our WhatsApp dispatch hotline is monitored actively:
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      "Hello! Urgent delivery status inquiry for weekend event."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn small ghost"
                    style={{ marginTop: 6, display: "inline-flex" }}
                  >
                    Chat on WhatsApp ({DISPLAY_PHONE})
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
