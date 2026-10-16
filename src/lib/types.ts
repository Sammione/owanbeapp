export type Grade = "A" | "B" | "C";

export type Item = {
  id: string;
  owner_id: string;
  hub_id: string | null;
  title: string;
  description: string | null;
  category: string;
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
  created_at: string;
};

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
