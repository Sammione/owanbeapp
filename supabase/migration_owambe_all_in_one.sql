-- =====================================================================
-- Migration: One-Stop Owambe Marketplace (Equipment, Catering & Services)
-- Run this whole script in Supabase → SQL Editor → New Query
-- =====================================================================

-- 1. Expand category check constraint to include Equipment and Catering
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in (
    -- Luxury Wardrobe & Footwear
    'Aso-ebi / lace',
    'Agbada',
    'Gele',
    'Beads & jewelry',
    'Shoes & Footwear',
    'Ankara',
    'Accessories',
    -- Event Equipment & Hardware Rentals
    'Coolers & Ice Chests',
    'Cooking Pots & Burners',
    'Chafing Dishes & Food Warmers',
    'Canopies, Tables & Chairs',
    'Generators & Sound Systems',
    -- Catering & Party Services
    'Party Catering & Jollof',
    'Small Chops & Finger Foods',
    'Cocktails & Drinks Bar',
    'Event Ushers & Protocol'
  ));

-- 2. Add vendor profile columns to profiles table
alter table public.profiles
  add column if not exists is_vendor boolean not null default false,
  add column if not exists business_name text,
  add column if not exists vendor_type text,
  add column if not exists verified_vendor boolean not null default false;

-- 3. Add equipment & service columns to items table
alter table public.items
  add column if not exists item_type text default 'garment',
  add column if not exists capacity text,
  add column if not exists quantity integer default 1;

-- 4. Anonymize owner_public view for complete two-way privacy
create or replace view public.owner_public as
  select
    id,
    'Verified Partner' as first_name,
    area
  from public.profiles;

grant select on public.owner_public to anon, authenticated;
