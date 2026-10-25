"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

export function ReferralBanner() {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("ref");
        if (code) {
          setRefCode(code.toUpperCase());
          localStorage.setItem("owambe_invite_ref", code.toUpperCase());
        } else {
          const stored = localStorage.getItem("owambe_invite_ref");
          if (stored) setRefCode(stored);
        }
      }
    } catch {}
  }, []);

  if (!refCode || dismissed) return null;

  return (
    <div
      role="banner"
      className="referral-welcome-banner"
      style={{
        background: "linear-gradient(90deg, #165337 0%, #1e3a8a 100%)",
        color: "#ffffff",
        padding: "8px 16px",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        position: "relative",
        zIndex: 50,
      }}
    >
      <div className="row g8" style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <span>🎁</span>
        <span>
          <strong>Friend Invite Activated:</strong> You received <strong>₦500 OFF</strong> your rental booking with code <strong>{refCode}</strong>!
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.8)",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Icon name="x" size={14} stroke={2} />
      </button>
    </div>
  );
}
