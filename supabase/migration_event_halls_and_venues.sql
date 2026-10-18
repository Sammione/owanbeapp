-- =====================================================================
-- Migration: Add Event Halls & Marquees and Venue Partner Subscriptions
-- Run this in Supabase → SQL Editor → New Query
-- =====================================================================

-- 1. Expand category check constraint to include Event Halls and Outdoor Venues
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
    -- Event Halls & Venues
    'Event Halls & Marquees',
    'Garden & Outdoor Venues',
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

-- 2. Ensure item_type check constraint allows 'venue'
alter table public.items drop constraint if exists items_item_type_check;
alter table public.items add constraint items_item_type_check
  check (item_type in ('garment', 'equipment', 'service', 'venue'));
