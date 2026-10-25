-- ============================================================================
-- OWAMBE CLOSET: REVIEWS, RATINGS, AND REFERRAL/INVITE SYSTEM
-- ============================================================================

-- 1. PROFILES EXTENSION (Referral Code & Credits)
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referral_credits integer default 0;

-- 2. REVIEWS & RATINGS TABLE
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  fit_feedback text,
  event_type text,
  verified_renter boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_item on public.reviews(item_id);
create index if not exists idx_reviews_user on public.reviews(user_id);

-- RLS for reviews
alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.role() = 'authenticated');

-- 3. REFERRALS / INVITE LOG TABLE
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references auth.users(id) on delete cascade,
  referral_code text not null,
  referred_user_id uuid references auth.users(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  discount_amount integer not null default 500,
  status text not null default 'applied' check (status in ('pending', 'applied', 'rewarded')),
  created_at timestamptz not null default now()
);

create index if not exists idx_referrals_code on public.referrals(referral_code);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

-- RLS for referrals
alter table public.referrals enable row level security;

create policy "Referrers can view their referral records"
  on public.referrals for select
  using (auth.uid() = referrer_id);
