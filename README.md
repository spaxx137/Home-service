# Ceejay Cellphone Repair Shop — Home Service Booking

Home-service repair booking MVP: public landing page + booking form, Viber
group notifications, technician suggestion/assignment, GCash/Maya payments
via PayMongo, and a basic CRM. See `Spec.md` in the original task for full
product context.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage) — schema in `supabase/migrations/`
- PayMongo (GCash/Maya checkout)
- Viber REST API (one-way group notifications)
- Google Maps Distance Matrix API (technician proximity scoring)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See `.env.example` for the full list. You'll need:

- **Supabase** — create a project at [supabase.com](https://supabase.com),
  then apply the SQL in `supabase/migrations/` (via the SQL editor, or the
  Supabase CLI: `supabase db push`). Copy the Project URL, anon key, and
  service role key into `.env.local`.
- **Google Maps** — a Maps JavaScript/Distance Matrix API key, used for
  address autocomplete and technician-distance scoring.
- **Viber** — a Viber Public Account/Bot auth token and the target group ID
  (external setup step, outside of code — see Spec.md Open Question 2).
- **PayMongo** — secret/public keys and a webhook secret from the PayMongo
  dashboard.

### Database schema

`supabase/migrations/0001_init.sql` creates the `customers`, `technicians`,
`bookings`, `payments`, and `follow_up_notes` tables (plus a `profiles`
table linking Supabase Auth users to an `admin`/`technician` role) with Row
Level Security policies: admins have full access, the public can create
customers/bookings (for the unauthenticated booking form), and technicians
can only see/update bookings assigned to them.

`supabase/migrations/0002_seed.sql` adds three placeholder technicians (one
per branch) so the dashboard and matching engine have data to start with —
replace with real technicians and coordinates.

### Creating admin/technician logins

Admin and technician accounts are Supabase Auth users with a matching row
in `profiles`. Until the admin dashboard grows a user-management screen,
create them via the Supabase dashboard (Authentication → Add user), then
insert a row into `profiles` with the matching `id` and the desired `role`.

## Project status

Being built milestone-by-milestone per Spec.md §11. Current state: project
scaffolding, Supabase schema, and auth/session wiring are in place.
