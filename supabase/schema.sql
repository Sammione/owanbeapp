-- =====================================================================
-- Owambe Closet – database schema
-- Run this whole file once in Supabase → SQL Editor → New query.
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- Profiles -------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  area        text,
  role        text not null default 'user' check (role in ('user','hub','admin')),
  created_at  timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Is the current user hub staff or an admin?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('hub','admin')
  );
$$;

-- ---------- Hubs (pickup / drop-off points) --------------------------
create table if not exists public.hubs (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  area     text not null,
  address  text,
  phone    text,
  active   boolean not null default true
);

-- ---------- Items (outfits and accessories) ---------------------------
create table if not exists public.items (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  hub_id           uuid references public.hubs(id),
  title            text not null check (char_length(title) between 3 and 90),
  description      text check (char_length(description) <= 600),
  category         text not null check (category in ('Aso-ebi / lace','Agbada','Gele','Beads & jewelry','Ankara','Accessories')),
  events           text[] not null default '{}',
  size_label       text,
  -- measurements in inches; null when not applicable (e.g. beads)
  bust             numeric(5,1),
  waist            numeric(5,1),
  hip              numeric(5,1),
  length           numeric(5,1),
  sleeve           numeric(5,1),
  pieces           text,               -- e.g. "Buba, iro, gele"
  price            integer not null check (price between 1000 and 500000),   -- naira per rental
  deposit          integer not null default 0 check (deposit >= 0),          -- naira, set by hub
  status           text not null default 'pending'
                   check (status in ('pending','live','paused','rejected','retired')),
  grade            text check (grade in ('A','B','C')),
  quality          text check (quality in ('premium','standard')),
  photos           text[] not null default '{}',  -- public URLs in the item-photos bucket
  rejection_reason text,
  cleaned_at       date,
  tag_code         text unique,                    -- sewn-in label / QR code
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists items_status_idx on public.items(status);
create index if not exists items_owner_idx  on public.items(owner_id);

-- Owners cannot approve or grade their own items. Only hub staff can
-- change status (except pausing/unpausing a live item), grade, quality,
-- deposit, cleaned date and tag.
create or replace function public.protect_item_fields()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if public.is_staff() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.grade := null; new.quality := null; new.deposit := 0;
    new.cleaned_at := null; new.tag_code := null; new.rejection_reason := null;
    return new;
  end if;
  -- UPDATE by owner
  if new.status is distinct from old.status
     and not (old.status = 'live' and new.status = 'paused')
     and not (old.status = 'paused' and new.status = 'live')
     and not (new.status = 'retired') then
    raise exception 'Only the hub can change this listing''s status';
  end if;
  new.grade := old.grade; new.quality := old.quality; new.deposit := old.deposit;
  new.cleaned_at := old.cleaned_at; new.tag_code := old.tag_code;
  new.rejection_reason := old.rejection_reason; new.owner_id := old.owner_id;
  -- Editing photos, measurements or price sends a listing back for review.
  if old.status in ('live','paused') and (
       new.photos is distinct from old.photos or new.price is distinct from old.price or
       new.bust is distinct from old.bust or new.waist is distinct from old.waist or
       new.hip is distinct from old.hip or new.length is distinct from old.length) then
    new.status := 'pending';
  end if;
  return new;
end $$;

drop trigger if exists items_protect on public.items;
create trigger items_protect before insert or update on public.items
  for each row execute function public.protect_item_fields();

-- ---------- Bookings ---------------------------------------------------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.items(id),
  renter_id        uuid not null references public.profiles(id),
  event_date       date not null,
  start_date       date not null,          -- day the renter collects it
  end_date         date not null,          -- day it must be back
  delivery         boolean not null default false,
  delivery_address text,
  rental_fee       integer not null,
  cleaning_fee     integer not null,
  delivery_fee     integer not null default 0,
  deposit          integer not null,
  total            integer not null,
  status           text not null default 'pending_payment'
                   check (status in ('pending_payment','paid','out','returned','completed','cancelled','conflict')),
  paystack_ref     text unique not null,
  pickup_code      text not null,
  late_fee         integer not null default 0,
  damage_charge    integer not null default 0,
  deposit_refund   integer,                 -- amount actually refunded
  owner_payout     integer,                 -- set when completed
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists bookings_item_idx   on public.bookings(item_id);
create index if not exists bookings_renter_idx on public.bookings(renter_id);

-- Final guard against double-booking: two confirmed bookings for the same
-- item cannot overlap, including 2 days after return for cleaning.
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    item_id with =,
    daterange(start_date, end_date + 2, '[]') with &&
  ) where (status in ('paid','out','returned'));

-- ---------- Condition reports (intake, check-out, return) -------------
create table if not exists public.condition_reports (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  booking_id  uuid references public.bookings(id),
  kind        text not null check (kind in ('intake','checkout','return')),
  grade       text check (grade in ('A','B','C')),
  checklist   jsonb not null default '{}',
  notes       text,
  photos      text[] not null default '{}',   -- paths in the private condition-photos bucket
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ---------- Saved items ------------------------------------------------
create table if not exists public.saved (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  item_id    uuid not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------- Public view of owners (first name + area only) ------------
create or replace view public.owner_public as
  select id, split_part(coalesce(full_name, 'Owner'), ' ', 1) as first_name, area
  from public.profiles;
grant select on public.owner_public to anon, authenticated;

-- ---------- Row level security ----------------------------------------
alter table public.profiles          enable row level security;
alter table public.hubs              enable row level security;
alter table public.items             enable row level security;
alter table public.bookings          enable row level security;
alter table public.condition_reports enable row level security;
alter table public.saved             enable row level security;

-- profiles
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "staff read profiles" on public.profiles;
create policy "own profile read"    on public.profiles for select using (id = auth.uid());
create policy "staff read profiles" on public.profiles for select using (public.is_staff());
create policy "own profile update"  on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

-- hubs
drop policy if exists "hubs public" on public.hubs;
drop policy if exists "hubs staff"  on public.hubs;
create policy "hubs public" on public.hubs for select using (true);
create policy "hubs staff"  on public.hubs for all using (public.is_staff()) with check (public.is_staff());

-- items
drop policy if exists "live items public" on public.items;
drop policy if exists "owner reads own"   on public.items;
drop policy if exists "staff reads all"   on public.items;
drop policy if exists "owner inserts"     on public.items;
drop policy if exists "owner updates"     on public.items;
drop policy if exists "staff updates"     on public.items;
create policy "live items public" on public.items for select using (status = 'live');
create policy "owner reads own"   on public.items for select using (owner_id = auth.uid());
create policy "staff reads all"   on public.items for select using (public.is_staff());
create policy "owner inserts"     on public.items for insert with check (owner_id = auth.uid());
create policy "owner updates"     on public.items for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "staff updates"     on public.items for update using (public.is_staff()) with check (public.is_staff());

-- bookings: created and paid only by the server (service role)
drop policy if exists "renter reads own"     on public.bookings;
drop policy if exists "owner reads item bookings" on public.bookings;
drop policy if exists "staff bookings"       on public.bookings;
create policy "renter reads own" on public.bookings for select using (renter_id = auth.uid());
create policy "owner reads item bookings" on public.bookings for select
  using (exists (select 1 from public.items i where i.id = item_id and i.owner_id = auth.uid()));
create policy "staff bookings" on public.bookings for all using (public.is_staff()) with check (public.is_staff());

-- condition reports
drop policy if exists "staff reports" on public.condition_reports;
drop policy if exists "owner reads reports" on public.condition_reports;
create policy "staff reports" on public.condition_reports for all using (public.is_staff()) with check (public.is_staff());
create policy "owner reads reports" on public.condition_reports for select
  using (exists (select 1 from public.items i where i.id = item_id and i.owner_id = auth.uid()));

-- saved
drop policy if exists "own saved" on public.saved;
create policy "own saved" on public.saved for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Availability helper (public, hides who booked) ------------
create or replace function public.item_busy_ranges(p_item uuid)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select b.start_date, b.end_date + 2
  from public.bookings b
  where b.item_id = p_item
    and (b.status in ('paid','out','returned')
         or (b.status = 'pending_payment' and b.created_at > now() - interval '30 minutes'))
    and b.end_date + 2 >= current_date;
$$;
grant execute on function public.item_busy_ranges(uuid) to anon, authenticated;

-- ---------- Storage buckets -------------------------------------------
insert into storage.buckets (id, name, public)
  values ('item-photos', 'item-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('condition-photos', 'condition-photos', false)
  on conflict (id) do nothing;

drop policy if exists "item photos upload own folder" on storage.objects;
drop policy if exists "item photos delete own"        on storage.objects;
drop policy if exists "condition photos staff"        on storage.objects;
create policy "item photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "item photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "condition photos staff" on storage.objects for all to authenticated
  using (bucket_id = 'condition-photos' and public.is_staff())
  with check (bucket_id = 'condition-photos' and public.is_staff());
