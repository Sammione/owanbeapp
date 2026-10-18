export type Grade = "A" | "B" | "C";
export type ItemType = "garment" | "equipment" | "service" | "venue";

export type Item = {
  id: string;
  owner_id: string;
  hub_id: string | null;
  title: string;
  description: string | null;
  category: string;
  item_type?: ItemType | null;
  capacity?: string | null;
  quantity?: number | null;
  events: string[];
  size_label: string | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
  length: number | null;
  sleeve: number | null;
  pieces: string | null;
  price: number;
  deposit: number;
  status: "pending" | "live" | "paused" | "rejected" | "retired";
  grade: Grade | null;
  quality: "premium" | "standard" | null;
  photos: string[];
  rejection_reason: string | null;
  cleaned_at: string | null;
  tag_code: string | null;
  venue_banquet_capacity?: number | string | null;
  venue_theater_capacity?: number | string | null;
  venue_parking_cars?: number | string | null;
  venue_generator_policy?: string | null;
  venue_ac_type?: string | null;
  venue_address?: string | null;
  venue_whatsapp?: string | null;
  subscription_status?: "active" | "trial" | "expired" | null;
  subscription_expires_at?: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  area: string | null;
  role: string;
  business_name?: string | null;
  vendor_type?: "tailor" | "equipment_rental" | "caterer" | "small_chops" | "drinks" | "event_services" | "hall_manager" | null;
  is_vendor?: boolean;
  verified_vendor?: boolean;
};

export type VendorProfile = Profile;

export type Hub = { id: string; name: string; area: string; address: string | null; phone: string | null };

export type Booking = {
  id: string;
  item_id: string;
  renter_id: string;
  event_date: string;
  start_date: string;
  end_date: string;
  delivery: boolean;
  delivery_address: string | null;
  rental_fee: number;
  cleaning_fee: number;
  delivery_fee: number;
  deposit: number;
  total: number;
  status: "pending_payment" | "paid" | "out" | "returned" | "completed" | "cancelled" | "conflict";
  paystack_ref: string;
  pickup_code: string;
  late_fee: number;
  damage_charge: number;
  deposit_refund: number | null;
  owner_payout: number | null;
  paid_at: string | null;
  created_at: string;
};
