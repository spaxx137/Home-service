-- Ceejay Home Service — initial schema
-- Tables: customers, technicians, bookings, payments, follow_up_notes
-- Roles: admin (dispatcher), technician — both are Supabase Auth users,
-- distinguished via the `profiles` table below.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type booking_status as enum (
  'new',
  'assigned',
  'en_route',
  'in_progress',
  'completed',
  'cancelled'
);

create type payment_status as enum (
  'unpaid',
  'pending',
  'paid',
  'failed',
  'refunded'
);

create type issue_type as enum (
  'screen_repair',
  'battery',
  'water_damage',
  'charging_port',
  'other'
);

create type time_window as enum (
  'morning',
  'afternoon',
  'evening'
);

create type payment_provider as enum (
  'paymongo_gcash',
  'paymongo_maya'
);

create type app_role as enum (
  'admin',
  'technician'
);

-- ---------------------------------------------------------------------------
-- profiles — links a Supabase Auth user to an app role (admin/technician)
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'technician',
  full_name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  address text not null,
  address_lat double precision,
  address_lng double precision,
  created_at timestamptz not null default now()
);

create index customers_phone_idx on customers (phone);

-- ---------------------------------------------------------------------------
-- technicians
-- ---------------------------------------------------------------------------

create table technicians (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null,
  name text not null,
  phone text not null,
  service_zone text not null,
  branch text,
  lat double precision,
  lng double precision,
  active_status boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create table bookings (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  customer_id uuid not null references customers (id) on delete cascade,
  device_info text not null,
  issue_type issue_type not null,
  issue_details text,
  notes text,
  photo_url text,
  preferred_date date not null,
  preferred_time time_window not null,
  status booking_status not null default 'new',
  payment_status payment_status not null default 'unpaid',
  amount numeric(10, 2) not null default 0,
  technician_id uuid references technicians (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_customer_id_idx on bookings (customer_id);
create index bookings_technician_id_idx on bookings (technician_id);
create index bookings_status_idx on bookings (status);
create index bookings_created_at_idx on bookings (created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookings_set_updated_at
  before update on bookings
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  -- Null until the PayMongo webhook reports which method the customer
  -- actually chose on the hosted checkout page (gcash vs. maya).
  provider payment_provider,
  -- PayMongo checkout session id, known immediately at creation — used to
  -- match the webhook event back to this row.
  checkout_session_id text,
  provider_reference text,
  amount numeric(10, 2) not null,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_booking_id_idx on payments (booking_id);
create unique index payments_checkout_session_id_idx on payments (checkout_session_id)
  where checkout_session_id is not null;
create unique index payments_provider_reference_idx on payments (provider_reference)
  where provider_reference is not null;

-- ---------------------------------------------------------------------------
-- follow_up_notes
-- ---------------------------------------------------------------------------

create table follow_up_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  note text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index follow_up_notes_customer_id_idx on follow_up_notes (customer_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;
alter table customers enable row level security;
alter table technicians enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table follow_up_notes enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

create or replace function current_technician_id()
returns uuid as $$
  select id from technicians where profile_id = auth.uid();
$$ language sql stable security definer;

-- profiles: a user can read their own profile; admins can read all
create policy profiles_select_own on profiles
  for select using (id = auth.uid() or is_admin());

-- customers/bookings/payments/follow_up_notes: admin has full access.
-- Public (anon) insert is allowed on customers/bookings so the booking
-- form can create records without requiring a login; all other access
-- is admin-only. Technicians can read/update only bookings assigned to them.

create policy customers_admin_all on customers
  for all using (is_admin()) with check (is_admin());

create policy customers_public_insert on customers
  for insert to anon with check (true);

create policy technicians_admin_all on technicians
  for all using (is_admin()) with check (is_admin());

create policy technicians_self_select on technicians
  for select using (profile_id = auth.uid());

create policy technicians_self_update_status on technicians
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy bookings_admin_all on bookings
  for all using (is_admin()) with check (is_admin());

create policy bookings_public_insert on bookings
  for insert to anon with check (true);

create policy bookings_technician_select on bookings
  for select using (technician_id = current_technician_id());

create policy bookings_technician_update_status on bookings
  for update using (technician_id = current_technician_id())
  with check (technician_id = current_technician_id());

create policy payments_admin_all on payments
  for all using (is_admin()) with check (is_admin());

create policy follow_up_notes_admin_all on follow_up_notes
  for all using (is_admin()) with check (is_admin());
