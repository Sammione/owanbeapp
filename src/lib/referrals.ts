/**
 * Referral / Invite System for Owambe Closet
 * "Invite a friend, earn ₦500 off your next rental"
 */

export const REFERRAL_DISCOUNT_NAIRA = 500;
export const REFERRAL_MIN_RENTAL_NAIRA = 5000;

export type ReferralStats = {
  referralCode: string;
  shareUrl: string;
  totalInvites: number;
  completedRentals: number;
  totalEarnedNaira: number;
  availableCreditsNaira: number;
};

/**
 * Generate a consistent, legible referral code for a user
 */
export function generateUserReferralCode(userId: string, name?: string | null): string {
  if (name && name.trim()) {
    const clean = name.trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length >= 3) {
      const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
      return `OWB-${clean}-${suffix}`;
    }
  }
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `OWB-${cleanId || "FRIEND"}`;
}

/**
 * Clean & normalize a referral code string
 */
export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Validate a referral code against rules or active promotion codes
 */
export function isValidReferralCode(code: string, currentUserId?: string | null): {
  valid: boolean;
  discount: number;
  message?: string;
} {
  const norm = normalizeReferralCode(code);
  if (!norm || norm.length < 4) {
    return { valid: false, discount: 0, message: "Please enter a valid referral code." };
  }

  // System promotional codes
  const PROMO_CODES: Record<string, number> = {
    "OWAMBE500": 500,
    "OWAMBEWELCOME": 500,
    "INVITE500": 500,
    "LAGOS500": 500,
  };

  if (PROMO_CODES[norm]) {
    return {
      valid: true,
      discount: PROMO_CODES[norm],
      message: `₦${PROMO_CODES[norm].toLocaleString()} referral invite discount applied!`,
    };
  }

  // Standard user referral code prefix
  if (norm.startsWith("OWB-") && norm.length >= 7) {
    if (currentUserId && generateUserReferralCode(currentUserId) === norm) {
      return {
        valid: false,
        discount: 0,
        message: "You cannot use your own invite code.",
      };
    }
    return {
      valid: true,
      discount: REFERRAL_DISCOUNT_NAIRA,
      message: `₦${REFERRAL_DISCOUNT_NAIRA.toLocaleString()} friend invite discount applied!`,
    };
  }

  return {
    valid: false,
    discount: 0,
    message: "Invalid referral code. Please check the code and try again.",
  };
}

/**
 * Build WhatsApp share URL for user's referral code
 */
export function getWhatsAppReferralLink(code: string, origin: string = ""): string {
  const inviteUrl = `${origin}/?ref=${encodeURIComponent(code)}`;
  const text = `Hey! I'm using Owambe Closet to rent luxury Aso-ebi, Agbada & event essentials in Lagos without breaking the bank. Use my invite code *${code}* to get *₦500 OFF* your next rental booking here: ${inviteUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
