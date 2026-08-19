# Ceejay Cellphone Repair Shop — Home Service Booking

Home-service repair booking MVP: public landing page + booking form, Viber
group notifications, technician suggestion/assignment, GCash/Maya payments
via PayMongo, and a basic CRM. See `Spec.md` in the original task for full
product context.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage) — schema in `supabase/migrations/`
- PayMongo (GCash/Maya Checkout Sessions)
- Viber REST API (one-way group notifications)
- Google Maps Geocoding API (turns a customer address into lat/lng for
  technician proximity scoring)

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
- **Google Maps** — a Geocoding API key. Without it, technician matching
  still works but ranks by workload only (no distance component).
- **Viber** — a Viber Public Account/Bot auth token and the target group ID
  (external setup step, outside of code — see Spec.md Open Question 2).
  Without it, bookings still get created; the Viber post is just skipped.
- **PayMongo** — a secret key and webhook secret from the PayMongo
  dashboard. Without a secret key, the booking form falls back to an
  in-page confirmation instead of a GCash/Maya checkout redirect. Once you
  have a key, register `https://<your-domain>/api/webhooks/paymongo` as a
  webhook endpoint in the PayMongo dashboard, subscribed to
  `checkout_session.payment.paid`, and put its signing secret in
  `PAYMONGO_WEBHOOK_SECRET`.

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

All 9 milestones from Spec.md §11 / the §9 MVP checklist are built: landing
page, booking form, admin dashboard, technician matching, technician view,
Viber notification, PayMongo payments, and CRM.

None of it has been tested against a live Supabase/PayMongo/Viber/Google
Maps project yet — everything so far has only been verified via
build/typecheck/lint and browser testing against placeholder credentials
(each external call degrades gracefully rather than crashing when
unconfigured). To actually try it end-to-end:

1. Create a Supabase project, apply the migrations, and fill in the
   Supabase env vars (see above).
2. Create at least one admin login (see below) and sign in at `/login`.
3. Optionally add the Google Maps, Viber, and PayMongo env vars — each
   feature works without them, just in its degraded/no-op mode until you
   do.
4. Submit a test booking at `/book` and confirm it shows up in
   `/admin/bookings`.

Two things flagged as best-effort rather than fully confirmed, since they
depend on accounts this environment doesn't have:

- The PayMongo webhook payload shape in `src/app/api/webhooks/paymongo/route.ts`
  is my best implementation from PayMongo's official Node SDK source and
  webhook signature docs, but I couldn't reach a full sample
  `checkout_session.payment.paid` payload to confirm field-for-field — worth
  checking against a real event in the PayMongo dashboard's webhook log
  once you have one.
- Open Question 1 (pricing) defaulted to "estimated price per issue type,
  charged in full at booking" since it was never confirmed — see
  `src/lib/constants.ts` (`ISSUE_TYPE_ESTIMATES`) if you'd rather switch to
  a deposit model.
