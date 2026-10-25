"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ReviewModal } from "./ReviewModal";
import { calculateReviewSummary, type Review, type ReviewSummary } from "@/lib/reviews";
import { niceDate } from "@/lib/format";

export function ReviewsSection({
  itemId,
  itemTitle,
  initialReviews = [],
}: {
  itemId: string;
  itemTitle: string;
  initialReviews?: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(initialReviews.length === 0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?itemId=${itemId}`);
        const data = await res.json();
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      } catch (e) {
        console.warn("Could not fetch reviews:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [itemId]);

  const summary: ReviewSummary = calculateReviewSummary(reviews);

  function handleReviewAdded(newReview: Review) {
    setReviews((prev) => [newReview, ...prev]);
  }

  return (
    <section className="reviews-section" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="row between" style={{ alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>
            Renter Reviews &amp; Ratings
          </h2>
          <span className="tiny muted">
            Verified ratings from Lagos celebrants who wore this look
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn small ghost"
          style={{ fontSize: "0.82rem" }}
        >
          ★ Rate &amp; Review
        </button>
      </div>

      {/* Summary Score Card */}
      <div
        className="box"
        style={{
          background: "var(--bg-inset)",
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
        }}
      >
        <div className="row between" style={{ alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {/* Average Stars */}
          <div style={{ textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, lineHeight: 1, color: "var(--ink)" }}>
              {summary.averageRating.toFixed(1)}
            </div>
            <div style={{ color: "#D4AF37", fontSize: "1.1rem", margin: "4px 0" }}>
              {"★".repeat(Math.round(summary.averageRating))}
              {"☆".repeat(5 - Math.round(summary.averageRating))}
            </div>
            <span className="tiny muted">
              Based on {summary.totalReviews} verified rental{summary.totalReviews === 1 ? "" : "s"}
            </span>
          </div>

          {/* Rating Breakdown Bars */}
          <div style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.ratingDistribution[stars] || 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="row g6" style={{ alignItems: "center", fontSize: "0.75rem", marginBottom: 3 }}>
                  <span style={{ width: 30, color: "var(--ink-secondary)" }}>{stars} ★</span>
                  <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#D4AF37",
                        borderRadius: 3,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span style={{ width: 24, textAlign: "right", color: "var(--ink-muted)" }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Fit Accuracy Badge */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(22, 83, 55, 0.1)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(22, 83, 55, 0.25)",
              textAlign: "center",
            }}
          >
            <span className="tiny-label" style={{ color: "var(--grade-a)" }}>Fit Confidence</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--grade-a)", marginTop: 2 }}>
              {summary.fitFeedbackPercent.trueToSize}%
            </div>
            <span className="tiny muted">Reported True to Size</span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="empty" style={{ padding: 16 }}>
          <p className="small muted" style={{ margin: 0 }}>
            Be the first to leave a review after your rental!
          </p>
        </div>
      ) : (
        <div className="stack g12">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="box"
              style={{
                background: "var(--bg-elevated)",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div className="row between" style={{ alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div className="row g6" style={{ alignItems: "center" }}>
                    <strong style={{ fontSize: "0.92rem" }}>{rev.user_name}</strong>
                    {rev.verified_renter && (
                      <span className="pill ok" style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                        ✔ Verified Renter
                      </span>
                    )}
                  </div>
                  <div className="row g8" style={{ alignItems: "center", marginTop: 2 }}>
                    <span style={{ color: "#D4AF37", fontSize: "0.95rem" }}>
                      {"★".repeat(rev.rating)}
                      {"☆".repeat(5 - rev.rating)}
                    </span>
                    {rev.event_type && (
                      <span className="tiny muted">· {rev.event_type}</span>
                    )}
                    {rev.fit_feedback && (
                      <span className="tiny" style={{ color: "var(--grade-a)", fontWeight: 600 }}>
                        · {rev.fit_feedback === "true_to_size" || rev.fit_feedback === "perfect_fit"
                            ? "True to Size"
                            : rev.fit_feedback === "runs_small"
                            ? "Runs Snug"
                            : "Relaxed Fit"}
                      </span>
                    )}
                  </div>
                </div>
                <span className="tiny muted">{niceDate(rev.created_at.slice(0, 10))}</span>
              </div>

              <p className="small" style={{ margin: "6px 0 0", color: "var(--ink-secondary)", lineHeight: 1.5 }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        itemId={itemId}
        itemTitle={itemTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewAdded={handleReviewAdded}
      />
    </section>
  );
}
