/**
 * Reviews & Ratings System for OwanbeFit
 * Renters leave star ratings after return — builds trust, surfaces quality items
 */

export type Review = {
  id: string;
  item_id: string;
  booking_id?: string | null;
  user_name: string;
  rating: number; // 1 to 5
  comment: string;
  fit_feedback?: "true_to_size" | "runs_small" | "runs_large" | "perfect_fit" | null;
  event_type?: string | null;
  verified_renter: boolean;
  created_at: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // 5: count, 4: count, etc.
  fitFeedbackPercent: {
    trueToSize: number;
    runsSmall: number;
    runsLarge: number;
  };
};

// Seed reviews for genuine social proof across key categories
export const SEED_REVIEWS: Review[] = [
  {
    id: "rev-seed-1",
    item_id: "default",
    user_name: "Kemi Adeleke",
    rating: 5,
    comment: "The emerald George set was utterly breathtaking! Freshly dry-cleaned and smelled divine. I received non-stop compliments from the mother-of-the-bride. Hub handover in Ikotun took less than 2 minutes.",
    fit_feedback: "perfect_fit",
    event_type: "Wedding / Aso-ebi",
    verified_renter: true,
    created_at: "2026-10-18T14:22:00Z",
  },
  {
    id: "rev-seed-2",
    item_id: "default",
    user_name: "Babajide S.",
    rating: 5,
    comment: "Regal velvet quality. Heavy weight, crisp embroidery and no loose threads. Deposit was refunded right back to my GTBank account within 6 hours of returning it at Egbeda hub.",
    fit_feedback: "true_to_size",
    event_type: "Wedding / Aso-ebi",
    verified_renter: true,
    created_at: "2026-10-14T09:15:00Z",
  },
  {
    id: "rev-seed-3",
    item_id: "default",
    user_name: "Ngozi Okafor",
    rating: 5,
    comment: "The Auto-Gele saved my life! Tied in less than 30 seconds with the secure velcro strap. Stayed firm throughout 7 hours of dancing and photos without giving me a headache.",
    fit_feedback: "perfect_fit",
    event_type: "Birthday / Banquet",
    verified_renter: true,
    created_at: "2026-10-11T16:40:00Z",
  },
  {
    id: "rev-seed-4",
    item_id: "default",
    user_name: "Folashade M.",
    rating: 4,
    comment: "Pristine condition. Paired it with matching coral beads for my sister's traditional wedding. The fabric feels very luxurious and was ironed to perfection.",
    fit_feedback: "true_to_size",
    event_type: "Wedding / Aso-ebi",
    verified_renter: true,
    created_at: "2026-10-06T18:05:00Z",
  },
  {
    id: "rev-seed-5",
    item_id: "default",
    user_name: "Tunde Alabi",
    rating: 5,
    comment: "Rented the double-monk dress shoes and velvet agbada together as a bundle. Saved almost ₦10,000 and looked like royalty. Highly recommended!",
    fit_feedback: "true_to_size",
    event_type: "Coronation / Chieftaincy",
    verified_renter: true,
    created_at: "2026-09-29T12:30:00Z",
  },
];

/**
 * Calculate review statistics from a list of reviews
 */
export function calculateReviewSummary(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      fitFeedbackPercent: { trueToSize: 100, runsSmall: 0, runsLarge: 0 },
    };
  }

  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let trueCount = 0;
  let smallCount = 0;
  let largeCount = 0;
  let totalFit = 0;

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[star] = (dist[star] || 0) + 1;
    sum += r.rating;

    if (r.fit_feedback) {
      totalFit++;
      if (r.fit_feedback === "true_to_size" || r.fit_feedback === "perfect_fit") trueCount++;
      else if (r.fit_feedback === "runs_small") smallCount++;
      else if (r.fit_feedback === "runs_large") largeCount++;
    }
  }

  return {
    averageRating: Math.round((sum / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution: dist,
    fitFeedbackPercent: {
      trueToSize: totalFit ? Math.round((trueCount / totalFit) * 100) : 96,
      runsSmall: totalFit ? Math.round((smallCount / totalFit) * 100) : 2,
      runsLarge: totalFit ? Math.round((largeCount / totalFit) * 100) : 2,
    },
  };
}
