"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icon";

export type PersonaMode = "renter" | "lender";

export function PersonaSwitcher({ currentMode }: { currentMode?: PersonaMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<PersonaMode>(currentMode || "renter");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("owambe_persona_mode") as PersonaMode | null;
      if (stored && (stored === "renter" || stored === "lender")) {
        if (!currentMode) {
          setMode(stored);
        }
      }
    } catch {}
  }, [currentMode]);

  function switchMode(newMode: PersonaMode) {
    setMode(newMode);
    try {
      localStorage.setItem("owambe_persona_mode", newMode);
    } catch {}

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    if (newMode === "lender") {
      params.set("tab", "listings");
    } else {
      params.set("tab", "rentals");
    }
    router.push(`/me?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="persona-switcher-wrap" role="region" aria-label="Account Mode Switcher">
      <div className="persona-switcher-pill">
        <button
          type="button"
          onClick={() => switchMode("renter")}
          className={`persona-tab-btn ${mode === "renter" ? "active" : ""}`}
          aria-pressed={mode === "renter"}
        >
          <span className="persona-tab-dot" />
          <span>Borrower Portal</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode("lender")}
          className={`persona-tab-btn ${mode === "lender" ? "active" : ""}`}
          aria-pressed={mode === "lender"}
        >
          <span className="persona-tab-dot" />
          <span>Wardrobe Partner (Lender)</span>
        </button>
      </div>

      <div className="persona-mode-notice">
        {mode === "renter" ? (
          <span>
            <strong>Borrower View:</strong> Browse and hire outfits &amp; footwear. Your identity is kept confidential from lenders.
          </span>
        ) : (
          <span>
            <strong>Partner View:</strong> Manage your listings and track earnings. Your identity is kept confidential from borrowers.
          </span>
        )}
      </div>
    </div>
  );
}
