"use client";
import React, { useState } from "react";
import { Icon } from "@/components/Icon";
import type { Review } from "@/lib/reviews";

export function ReviewModal({
  itemId,
  itemTitle,
  isOpen,
  onClose,
  onReviewAdded,
}: {
  itemId: string;
  itemTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewAdded?: (newReview: Review) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fitFeedback, setFitFeedback] = useState<"true_to_size" | "runs_small" | "runs_large">("true_to_size");
  const [eventType, setEventType] = useState("Wedding / Aso-ebi");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!comment || comment.trim().length < 5) {
      setError("Please write a short review about the fit and quality (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          rating,
          comment,
          fitFeedback,
          eventType,
          userName: userName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit review.");
      }

      setSuccess(true);
      if (onReviewAdded && data.review) {
        onReviewAdded(data.review);
      }
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setComment("");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="cart-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Write a Review"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}
    >
      <div
        className="box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          margin: 16,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="row between" style={{ alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Review &amp; Rate Outfit</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close modal">
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>

        <p className="tiny muted" style={{ margin: "0 0 16px" }}>
          Share your experience with <strong>{itemTitle}</strong> to help fellow Lagos celebrants find the right look.
        </p>

        {success ? (
          <div className="notice ok" style={{ textAlign: "center", padding: 20 }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}>🎉</span>
            <strong>Thank you for your review!</strong>
            <p className="tiny muted" style={{ margin: "4px 0 0" }}>Your rating has been recorded and verified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack g14">
            {/* Star Selector */}
            <div>
              <label className="tiny-label" style={{ display: "block", marginBottom: 6 }}>
                Overall Star Rating *
              </label>
              <div className="row g6" style={{ alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.8rem",
                      color: star <= (hoverRating || rating) ? "#D4AF37" : "var(--border)",
                      transition: "transform 0.1s ease",
                      transform: star <= (hoverRating || rating) ? "scale(1.1)" : "scale(1)",
                      padding: 2,
                    }}
                    aria-label={`${star} star`}
                  >
                    ★
                  </button>
                ))}
                <span className="small muted" style={{ marginLeft: 8, fontWeight: 600 }}>
                  {rating === 5
                    ? "Exceptional (5/5)"
                    : rating === 4
                    ? "Great (4/5)"
                    : rating === 3
                    ? "Good (3/5)"
                    : `${rating}/5 Stars`}
                </span>
              </div>
            </div>

            {/* Fit Feedback */}
            <div>
              <label className="tiny-label" style={{ display: "block", marginBottom: 6 }}>
                How Did It Fit?
              </label>
              <div className="seg" role="group">
                <button
                  type="button"
                  aria-pressed={fitFeedback === "runs_small"}
                  onClick={() => setFitFeedback("runs_small")}
                >
                  Runs Snug / Small
                </button>
                <button
                  type="button"
                  aria-pressed={fitFeedback === "true_to_size"}
                  onClick={() => setFitFeedback("true_to_size")}
                >
                  True to Size (Perfect)
                </button>
                <button
                  type="button"
                  aria-pressed={fitFeedback === "runs_large"}
                  onClick={() => setFitFeedback("runs_large")}
                >
                  Generous / Relaxed
                </button>
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label htmlFor="rev-event" className="tiny-label" style={{ display: "block", marginBottom: 4 }}>
                Event Attended
              </label>
              <select
                id="rev-event"
                className="input small"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="Wedding / Aso-ebi">Wedding / Aso-ebi</option>
                <option value="Anniversary / Banquet">Anniversary / Banquet</option>
                <option value="Birthday Celebration">Birthday Celebration</option>
                <option value="Coronation / Chieftaincy">Coronation / Chieftaincy</option>
                <option value="Sunday Thanksgiving">Sunday Thanksgiving</option>
                <option value="Corporate Owambe Gala">Corporate Owambe Gala</option>
              </select>
            </div>

            {/* Review Comment */}
            <div>
              <label htmlFor="rev-comment" className="tiny-label" style={{ display: "block", marginBottom: 4 }}>
                Your Honest Feedback &amp; Compliments *
              </label>
              <textarea
                id="rev-comment"
                className="input small"
                rows={3}
                placeholder="How was the fabric, cleanliness, comfort, and compliments you received?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            {/* Reviewer Name */}
            <div>
              <label htmlFor="rev-name" className="tiny-label" style={{ display: "block", marginBottom: 4 }}>
                Your Name / Display Alias (Optional)
              </label>
              <input
                id="rev-name"
                type="text"
                className="input small"
                placeholder="e.g. Kemi A., Lekki"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            {error && <p className="error small">{error}</p>}

            <button
              type="submit"
              className="btn block"
              disabled={submitting}
              style={{ height: 44, marginTop: 6 }}
            >
              {submitting ? "Submitting Review…" : "Publish Verified Review →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
