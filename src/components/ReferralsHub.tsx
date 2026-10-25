"use client";
import React, { useState } from "react";
import { Icon } from "@/components/Icon";
import { getWhatsAppReferralLink, REFERRAL_DISCOUNT_NAIRA } from "@/lib/referrals";
import { naira } from "@/lib/format";

export function ReferralsHub({
  referralCode,
  userName,
  credits = 500,
}: {
  referralCode: string;
  userName?: string | null;
  credits?: number;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://owambe-closet.com";
  const inviteUrl = `${origin}/?ref=${encodeURIComponent(referralCode)}`;
  const waUrl = getWhatsAppReferralLink(referralCode, origin);

  function handleCopyCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  function handleCopyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="stack g16 narrow" style={{ maxWidth: 560, margin: 0 }}>
      {/* Hero Card */}
      <div
        className="box"
        style={{
          background: "linear-gradient(135deg, rgba(22, 83, 55, 0.12) 0%, rgba(212, 175, 55, 0.12) 100%)",
          borderColor: "rgba(22, 83, 55, 0.3)",
          padding: 24,
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
          <span className="pill ok" style={{ textTransform: "uppercase", fontSize: "0.72rem" }}>
            Referral &amp; Invite Program
          </span>
          <span className="tiny muted">100% Free to Join</span>
        </div>

        <h2 style={{ fontSize: "1.4rem", margin: "8px 0 4px" }}>
          Invite a Friend, Earn ₦500 Off
        </h2>
        <p className="small muted" style={{ margin: "0 0 16px" }}>
          Share your personal code with friends attending an owambe. When they complete their first rental, they get <strong>₦500 off</strong> and you earn <strong>₦500 credit</strong> towards your next look!
        </p>

        {/* Code Box */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1.5px dashed var(--accent-gold)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            textAlign: "center",
          }}
        >
          <span className="tiny-label" style={{ display: "block", marginBottom: 4 }}>
            Your Personal Invite Code
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: 2,
              color: "var(--accent-gold)",
              fontFamily: "monospace",
              margin: "4px 0 10px",
            }}
          >
            {referralCode}
          </div>

          <div className="row g8 wrap" style={{ justifyContent: "center" }}>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn small ghost"
              style={{ minWidth: 120 }}
            >
              {copiedCode ? "Code Copied! ✔" : "Copy Code"}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn small ghost"
              style={{ minWidth: 120 }}
            >
              {copiedLink ? "Link Copied! ✔" : "Copy Invite Link"}
            </button>
          </div>
        </div>

        {/* WhatsApp Share Action */}
        <div style={{ marginTop: 16 }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn block"
            style={{
              background: "#25D366",
              color: "#ffffff",
              borderColor: "#25D366",
              fontWeight: 700,
              fontSize: "0.92rem",
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
            }}
          >
            <span>Share via WhatsApp with Friends →</span>
          </a>
        </div>
      </div>

      {/* Rewards & Stats Balance */}
      <div className="grid2" style={{ gap: 12 }}>
        <div className="box" style={{ padding: 16, textAlign: "center" }}>
          <span className="tiny muted">Available Rental Credit</span>
          <strong style={{ fontSize: "1.4rem", display: "block", marginTop: 4, color: "var(--grade-a)" }}>
            {naira(credits)}
          </strong>
          <span className="tiny muted" style={{ display: "block", marginTop: 2 }}>
            Applied automatically at checkout
          </span>
        </div>

        <div className="box" style={{ padding: 16, textAlign: "center" }}>
          <span className="tiny muted">Friend Signups &amp; Rentals</span>
          <strong style={{ fontSize: "1.4rem", display: "block", marginTop: 4, color: "var(--ink)" }}>
            2 Friends
          </strong>
          <span className="tiny muted" style={{ display: "block", marginTop: 2 }}>
            Earned ₦1,000 in total discounts
          </span>
        </div>
      </div>

      {/* How it Works Step-by-Step */}
      <div className="box" style={{ padding: 18 }}>
        <h3 style={{ fontSize: "1.05rem", margin: "0 0 12px" }}>How Referral Rewards Work</h3>
        <div className="stack g12">
          <div className="row g10" style={{ alignItems: "flex-start" }}>
            <span style={{ background: "var(--accent-gold-soft)", color: "var(--accent-gold)", fontWeight: 800, width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
              1
            </span>
            <div>
              <strong className="small" style={{ display: "block" }}>Share your code or link</strong>
              <span className="tiny muted">Send your link to friends attending weddings, birthdays, or church owambes.</span>
            </div>
          </div>

          <div className="row g10" style={{ alignItems: "flex-start" }}>
            <span style={{ background: "var(--accent-gold-soft)", color: "var(--accent-gold)", fontWeight: 800, width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
              2
            </span>
            <div>
              <strong className="small" style={{ display: "block" }}>Friend saves ₦500 on their first rental</strong>
              <span className="tiny muted">When they book any Aso-ebi, Agbada, or shoes using your code, ₦500 is instantly deducted.</span>
            </div>
          </div>

          <div className="row g10" style={{ alignItems: "flex-start" }}>
            <span style={{ background: "var(--accent-gold-soft)", color: "var(--accent-gold)", fontWeight: 800, width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
              3
            </span>
            <div>
              <strong className="small" style={{ display: "block" }}>You receive ₦500 credit immediately</strong>
              <span className="tiny muted">Your reward is deposited in your account and deducted from your next event hire.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
