# Spec.md — Ceejay Cellphone Repair Shop: Home Service Booking MVP

## 1. Context

Ceejay Cellphone Repair Shop runs 3 physical branches plus a daily home-service repair offering. Home service requests are currently handled entirely manually: a form is filled out on paper/chat, then copy-pasted into a Viber group, and a technician is assigned by a person eyeballing availability. There is no CRM, no online payments, and no landing page.

## 2. Goal of this MVP

Replace the manual home-service intake and assignment flow with a lightweight web app that:

1. Gives customers a public landing page + booking form for home service repairs.
2. Automatically notifies the shop's Viber group when a new booking comes in (one-way).
3. Suggests the best-fit technician for each job (proximity + current workload) and lets an admin confirm the assignment with one tap.
4. Accepts online payment via GCash/Maya for the service (or a booking deposit — TBD, see Open Questions).
5. Stores every booking/customer as a lead/record in a simple CRM view so the shop can follow up.

Everything else (full inventory management, two-way Viber bot, card payments) is explicitly **out of scope** for this MVP — noted as Phase 2 below.

## 3. Users & Roles

- **Customer** — no login required. Fills out the public booking form, pays online, gets a confirmation.
- **Admin/Dispatcher** (shop owner or staff) — logs in to a dashboard. Sees incoming bookings, confirms suggested technician (or reassigns manually), tracks status, sees the CRM/leads list.
- **Technician** — logs in to a simple view (or receives via Viber/SMS for MVP) to see jobs assigned to them and mark status (accepted / en route / completed).

## 4. Core User Flows

### 4.1 Customer books home service
1. Customer lands on the home-service landing page.
2. Fills out the booking form (see §5 for fields).
3. Reviews estimated cost (based on service type selected) and pays via GCash/Maya, **or** pays a fixed booking deposit — needs your decision, see Open Questions.
4. Gets an on-screen confirmation + email/SMS confirmation with a reference number.
5. Booking is created in the system with status `New`.

### 4.2 New booking notification
1. On booking creation, the system automatically posts a formatted message to the shop's Viber group (via Viber Bot API / Channel) containing: customer name, phone, address, device/issue, preferred time, reference number.
2. This replaces the current manual copy-paste step.

### 4.3 Technician suggestion & assignment
1. System looks at the customer's address and each technician's:
   - Current active job count (workload)
   - Approximate service area / last known job location
   - Availability status (on/off duty — manually toggled by technician or admin)
2. System ranks technicians and shows the admin a **suggested technician** (with 2nd/3rd best as fallback options) on the booking's dashboard row.
3. Admin taps "Confirm" to assign, or picks a different technician from the list.
4. Assigned technician is notified (Viber/SMS/dashboard) and booking status becomes `Assigned`.

### 4.4 Job lifecycle
`New` → `Assigned` → `En Route` → `In Progress` → `Completed` (or `Cancelled`)
Technician updates status from their view; customer can see status via a tracking link (nice-to-have, see Open Questions).

### 4.5 CRM / Leads
- Every booking (completed or not) becomes a customer record.
- Admin can see a list of all customers, their booking history, total spend, and add follow-up notes (e.g. "offered promo, awaiting reply").
- Simple filter/search by name, phone, status, date range.

## 5. Home Service Booking Form — Fields

**Please confirm/edit this field list — this is my proposed draft:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Full Name | text | ✅ | |
| Mobile Number | text (PH format) | ✅ | used for SMS/Viber confirmation |
| Email | email | optional | for confirmation, if provided |
| Service Address | text + map pin | ✅ | needed for technician-distance matching |
| Device Brand/Model | text or dropdown | ✅ | e.g. "iPhone 13", "Samsung A54" |
| Issue/Service Needed | dropdown + free text | ✅ | e.g. screen repair, battery, water damage, other |
| Photo Upload | file (optional) | optional | helps technician prep parts |
| Preferred Date | date picker | ✅ | |
| Preferred Time Window | dropdown (e.g. morning/afternoon/evening or hour blocks) | ✅ | |
| Notes | textarea | optional | gate access, landmark, etc. |

**Open question:** Should the form show an estimated price per issue type before payment, or is pricing determined after a technician inspects the device? This affects whether payment happens at booking time or after diagnosis.

## 6. Technician Matching Logic (MVP version)

Simple, explainable scoring — not full route optimization:

```
score = (distance_weight × proximity_score) + (workload_weight × availability_score)
```

- **Proximity score**: straight-line or Google Maps API distance between customer address and technician's assigned service zone/branch.
- **Availability score**: inverse of technician's current active job count for the day.
- Suggested weights: 60% proximity, 40% workload (adjustable).
- Output: top 3 ranked technicians shown to admin; admin always has final say (per your answer, this is suggest-and-confirm, not full auto-assign).

## 7. Tech Stack (proposed default — flag if you want something else)

- **Frontend + Landing Page**: Next.js (React) + Tailwind CSS — one codebase for landing page, booking form, and admin dashboard.
- **Backend/API**: Next.js API routes (or a separate Node/Express service if it grows).
- **Database**: PostgreSQL via Supabase (also gives you auth, storage for photo uploads, and a hosted Postgres for free/cheap on MVP scale).
- **Auth**: Supabase Auth for Admin/Technician logins (email/password to start).
- **Payments**: PayMongo (PH-based payment gateway that supports GCash and Maya via a simple API) — recommended over trying to integrate GCash directly.
- **Viber notification**: Viber REST API (Bot/Public Account) — sending outbound messages to a group/channel. Requires a verified Viber Public Account; flagged as a setup dependency, not a code dependency.
- **Maps/Distance**: Google Maps Distance Matrix API (for proximity scoring and address autocomplete on the form).
- **Hosting**: Vercel (frontend/API) + Supabase (DB/auth/storage).

## 8. Data Model (starting point)

- `customers`: id, name, phone, email, address, created_at
- `bookings`: id, customer_id, device_info, issue_type, notes, photo_url, preferred_date, preferred_time, status, payment_status, amount, technician_id, created_at
- `technicians`: id, name, phone, service_zone, active_status, created_at
- `payments`: id, booking_id, provider, provider_reference, amount, status, paid_at
- `follow_up_notes`: id, customer_id, note, created_by, created_at

## 9. MVP Scope Checklist

**In scope:**
- [ ] Public landing page for home service
- [ ] Booking form → creates booking in DB
- [ ] Auto-post new booking to Viber group (one-way)
- [ ] Technician suggestion engine (proximity + workload) + admin confirm/reassign UI
- [ ] Technician view to see assigned jobs + update status
- [ ] GCash/Maya payment via PayMongo at booking or after diagnosis (per your answer)
- [ ] Basic CRM list: customers, booking history, status, follow-up notes
- [ ] Admin login (Supabase Auth)

**Explicitly out of scope for MVP (Phase 2):**
- Two-way Viber bot (customer replies, chat-based status updates) — requires Viber business verification, bigger effort
- Card payments (Stripe/etc.)
- Full inventory management system
- Automated (no-human) technician assignment
- Multi-branch inventory sync

## 10. Open Questions — need your answers before/while building

1. **Pricing at booking time**: Do you want to show estimated prices per issue type on the form (and charge that amount), or collect a fixed deposit and settle the rest after the technician inspects the device in person?
2. **Viber Public Account**: Do you already have a Viber Public Account/Business account set up, or does this need to be created first? (Required before Viber notifications can be built — it's an account/verification step outside of code.)
3. **Technician count & service zones**: Roughly how many technicians do you have doing home service, and do they already have defined coverage areas (e.g. by city/barangay), or should zones be based on your 3 branch locations?
4. **Customer tracking link**: Do customers need a "track my technician's status" page, or is an SMS/Viber update at each stage enough for MVP?
5. **Branding**: Do you have an existing logo/color scheme for Ceejay Cellphone Repair Shop to use on the landing page, or should Claude Code propose a look?

---

## 11. Instructions for Claude Code

Build this MVP in the following order, confirming each milestone works before moving to the next:

1. **Project setup** — Next.js + Tailwind + Supabase project scaffolding, with `bookings`, `customers`, `technicians`, `payments`, `follow_up_notes` tables per §8.
2. **Landing page** — public page describing home service, with a prominent "Book Now" CTA leading to the form.
3. **Booking form** — implement fields from §5, validate required fields, write to `bookings`/`customers` on submit, show a confirmation screen with reference number.
4. **Admin dashboard (auth-gated)** — list of bookings with status, filters, and a detail view per booking.
5. **Technician matching** — implement the scoring logic from §6; surface top-3 suggested technicians on each booking's detail view with a one-click "Confirm assignment" action.
6. **Technician view (auth-gated)** — simple page showing a technician their assigned jobs and a status-update control.
7. **Viber notification** — on booking creation, call the Viber REST API to post to the shop's group/channel with booking details (use env var for the auth token; do not hardcode).
8. **Payments** — integrate PayMongo for GCash/Maya; trigger payment either at booking submission or after diagnosis, per the answer to Open Question 1. Update `payments` and `bookings.payment_status` on webhook confirmation.
9. **CRM view** — customer list with booking history and a free-text follow-up notes field, addable by admin.

At each step, pause and confirm the feature works end-to-end before starting the next — don't build all 9 steps in one pass.
