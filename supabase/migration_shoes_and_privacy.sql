-- =====================================================================
-- Migration: Add Shoes & Footwear Category and Anonymity Support
-- Run this in Supabase SQL Editor if you already ran schema.sql previously.
-- =====================================================================

-- 1. Update items category check constraint to include 'Shoes & Footwear'
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in (
    'Aso-ebi / lace',
    'Agbada',
    'Gele',
    'Beads & jewelry',
    'Shoes & Footwear',
    'Ankara',
    'Accessories'
  ));

-- 2. Anonymize owner_public view to prevent borrower from seeing lender's real identity
create or replace view public.owner_public as
  select
    id,
    'Verified Partner' as first_name,
    area
  from public.profiles;

grant select on public.owner_public to anon, authenticated;
