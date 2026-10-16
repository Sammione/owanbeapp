-- Starter hubs for the Ikotun–Egbeda–Igando zone. Edit names and addresses
-- to match the real partner shops you sign up.
insert into public.hubs (name, area, address, phone) values
  ('Ikotun Hub',  'Ikotun', 'Partner tailor shop – add address', null),
  ('Egbeda Hub',  'Egbeda', 'Partner boutique – add address',    null),
  ('Igando Hub',  'Igando', 'Partner shop – add address',        null)
on conflict do nothing;

-- After you sign in to the app once, make yourself an admin:
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
