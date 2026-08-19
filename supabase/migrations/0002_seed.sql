-- Placeholder technicians, one per branch, so the matching engine and
-- admin dashboard have data to work with out of the box. Replace lat/lng
-- with the branches' real coordinates and edit/add technicians as needed —
-- see Spec.md Open Question 3 (technician count & service zones).

insert into technicians (name, phone, service_zone, branch, lat, lng, active_status)
values
  ('Branch 1 Technician', '+639170000001', 'Branch 1 area', 'Branch 1', 14.5995, 120.9842, true),
  ('Branch 2 Technician', '+639170000002', 'Branch 2 area', 'Branch 2', 14.6760, 121.0437, true),
  ('Branch 3 Technician', '+639170000003', 'Branch 3 area', 'Branch 3', 14.5378, 121.0014, true);
