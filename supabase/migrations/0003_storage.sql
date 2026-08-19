-- Storage bucket for booking photo uploads (Spec.md §5, "Photo Upload").
-- Public bucket so admins/technicians can view photos via a plain URL;
-- uploads happen server-side via the service role (API route), so no
-- public insert policy is needed.

insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', true)
on conflict (id) do nothing;
