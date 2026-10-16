"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type GarmentMeasures = {
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  length?: number | null;
  size_label?: string | null;
  category?: string | null;
};

type MetricState = {
  bust: string;
  waist: string;
  hip: string;
  unit: "in" | "cm";
};

export function FitChecker({ item }: { item: GarmentMeasures }) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [bodyBust, setBodyBust] = useState("");
  const [bodyWaist, setBodyWaist] = useState("");
  const [bodyHip, setBodyHip] = useState("");

  // Load saved sizing from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("owambe_renter_sizing");
      if (saved) {
        const parsed: MetricState = JSON.parse(saved);
        if (parsed.unit) setUnit(parsed.unit);
        if (parsed.bust) setBodyBust(parsed.bust);
        if (parsed.waist) setBodyWaist(parsed.waist);
        if (parsed.hip) setBodyHip(parsed.hip);
      }
    } catch {}
  }, []);

  const toInches = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return null;
    return unit === "cm" ? num / 2.54 : num;
  };

  const renterBustIn = toInches(bodyBust);
  const renterWaistIn = toInches(bodyWaist);
  const renterHipIn = toInches(bodyHip);

  // Save changes
  function updateSizing(b: string, w: string, h: string, u: "in" | "cm") {
    try {
      localStorage.setItem(
        "owambe_renter_sizing",
        JSON.stringify({ bust: b, waist: w, hip: h, unit: u })
      );
    } catch {}
  }

  // Evaluate fit
  const results: { point: string; status: "good" | "tight" | "loose"; diff: number; text: string }[] = [];

  if (item.bust && renterBustIn) {
    const diff = item.bust - renterBustIn;
    if (diff < -1.0) {
      results.push({ point: "Bust", status: "tight", diff, text: `Garment bust is ${Math.abs(diff).toFixed(1)}″ smaller than your measurement (tight fit)` });
    } else if (diff >= -1.0 && diff <= 3.0) {
      results.push({ point: "Bust", status: "good", diff, text: "Excellent fit with comfortable owambe drape" });
    } else {
      results.push({ point: "Bust", status: "loose", diff, text: `Garment bust is ${diff.toFixed(1)}″ larger (relaxed/loose fit)` });
    }
  }

  if (item.waist && renterWaistIn) {
    const diff = item.waist - renterWaistIn;
    if (diff < -0.8) {
      results.push({ point: "Waist", status: "tight", diff, text: `Garment waist is ${Math.abs(diff).toFixed(1)}″ smaller than your waist` });
    } else if (diff >= -0.8 && diff <= 2.5) {
      results.push({ point: "Waist", status: "good", diff, text: "Ideal fit around the natural waist" });
    } else {
      results.push({ point: "Waist", status: "loose", diff, text: `Garment waist is ${diff.toFixed(1)}″ larger (roomy)` });
    }
  }

  if (item.hip && renterHipIn) {
    const diff = item.hip - renterHipIn;
    if (diff < -1.0) {
      results.push({ point: "Hip", status: "tight", diff, text: `Garment hip is ${Math.abs(diff).toFixed(1)}″ smaller` });
    } else if (diff >= -1.0 && diff <= 3.5) {
      results.push({ point: "Hip", status: "good", diff, text: "Great silhouette with room to dance" });
    } else {
      results.push({ point: "Hip", status: "loose", diff, text: `Garment hip is ${diff.toFixed(1)}″ roomier` });
    }
  }

  const hasAnyInput = !!(renterBustIn || renterWaistIn || renterHipIn);
  const anyTight = results.some((r) => r.status === "tight");
  const allGood = results.length > 0 && results.every((r) => r.status === "good");

  return (
    <div className="box" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
      <div className="row between">
        <div className="stack g2">
          <div className="row g6" style={{ alignItems: "center" }}>
            <Icon name="ruler" size={15} stroke={1.8} />
            <strong style={{ fontSize: 14 }}>Interactive Fit Checker</strong>
          </div>
          <span className="tiny muted">Compare with your body measurements</span>
        </div>

        <button
          type="button"
          className="btn small ghost"
          onClick={() => setOpen(!open)}
          style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
        >
          {open ? "Hide Calculator" : hasAnyInput ? "Update Sizing" : "Check Your Fit"}
        </button>
      </div>

      {open && (
        <div className="stack g12" style={{ paddingTop: 8 }}>
          <div className="row between">
            <span className="tiny strong">Enter Your Measurements:</span>
            <div className="row g4">
              <button
                type="button"
                className={`filter-pill ${unit === "in" ? "active" : ""}`}
                style={{ padding: "2px 8px", fontSize: 11 }}
                onClick={() => {
                  setUnit("in");
                  updateSizing(bodyBust, bodyWaist, bodyHip, "in");
                }}
              >
                Inches (in)
              </button>
              <button
                type="button"
                className={`filter-pill ${unit === "cm" ? "active" : ""}`}
                style={{ padding: "2px 8px", fontSize: 11 }}
                onClick={() => {
                  setUnit("cm");
                  updateSizing(bodyBust, bodyWaist, bodyHip, "cm");
                }}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>

          <div className="grid3">
            {item.bust ? (
              <div className="field">
                <label htmlFor="fit_bust" className="tiny">Your Bust ({unit})</label>
                <input
                  id="fit_bust"
                  type="number"
                  step="0.5"
                  className="input"
                  style={{ minHeight: 38, padding: "6px 10px", fontSize: 13 }}
                  placeholder={unit === "in" ? "e.g. 36" : "e.g. 91"}
                  value={bodyBust}
                  onChange={(e) => {
                    setBodyBust(e.target.value);
                    updateSizing(e.target.value, bodyWaist, bodyHip, unit);
                  }}
                />
              </div>
            ) : null}

            {item.waist ? (
              <div className="field">
                <label htmlFor="fit_waist" className="tiny">Your Waist ({unit})</label>
                <input
                  id="fit_waist"
                  type="number"
                  step="0.5"
                  className="input"
                  style={{ minHeight: 38, padding: "6px 10px", fontSize: 13 }}
                  placeholder={unit === "in" ? "e.g. 30" : "e.g. 76"}
                  value={bodyWaist}
                  onChange={(e) => {
                    setBodyWaist(e.target.value);
                    updateSizing(bodyBust, e.target.value, bodyHip, unit);
                  }}
                />
              </div>
            ) : null}

            {item.hip ? (
              <div className="field">
                <label htmlFor="fit_hip" className="tiny">Your Hip ({unit})</label>
                <input
                  id="fit_hip"
                  type="number"
                  step="0.5"
                  className="input"
                  style={{ minHeight: 38, padding: "6px 10px", fontSize: 13 }}
                  placeholder={unit === "in" ? "e.g. 40" : "e.g. 102"}
                  value={bodyHip}
                  onChange={(e) => {
                    setBodyHip(e.target.value);
                    updateSizing(bodyBust, bodyWaist, e.target.value, unit);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Live Fit Feedback Results */}
      {hasAnyInput && results.length > 0 && (
        <div className="stack g8" style={{ paddingTop: 4 }}>
          {results.map((r) => (
            <div
              key={r.point}
              className="row between"
              style={{
                fontSize: 12.5,
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                flexWrap: "wrap",
                gap: "4px 8px",
                background:
                  r.status === "good"
                    ? "var(--grade-a-bg)"
                    : r.status === "tight"
                    ? "var(--bad-bg)"
                    : "var(--grade-b-bg)",
                color:
                  r.status === "good"
                    ? "var(--grade-a)"
                    : r.status === "tight"
                    ? "var(--bad)"
                    : "var(--grade-b)",
              }}
            >
              <span className="strong">{r.point}</span>
              <span>{r.text}</span>
            </div>
          ))}

          {allGood && (
            <p className="tiny" style={{ color: "var(--grade-a)", fontWeight: 600 }}>
              ✓ Recommended! This look is an ideal match for your measurements.
            </p>
          )}

          {anyTight && (
            <p className="tiny" style={{ color: "var(--bad)", fontWeight: 600 }}>
              Fit Advisory: This garment may feel tight or restrictive in some areas. Consider sizing up if you prefer a relaxed drape.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
