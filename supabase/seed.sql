-- ============================================================
-- Cuely — Seed Data for Development/Testing
-- ============================================================

insert into public.businesses (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Sunrise Clinic');

insert into public.queues (id, business_id, name, is_active) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'General OPD', true);

-- Past tickets (already served)
insert into public.tickets (id, queue_id, token_number, customer_phone, status, joined_at, called_at, served_at) values
  ('aaaa0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1, '+919876543210', 'served',
    now() - interval '2 hours', now() - interval '1 hour 55 minutes', now() - interval '1 hour 50 minutes'),
  ('aaaa0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 2, '+919876543211', 'served',
    now() - interval '1 hour 50 minutes', now() - interval '1 hour 45 minutes', now() - interval '1 hour 38 minutes'),
  ('aaaa0003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 3, NULL, 'served',
    now() - interval '1 hour 40 minutes', now() - interval '1 hour 35 minutes', now() - interval '1 hour 30 minutes'),
  ('aaaa0004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 4, '+919876543213', 'served',
    now() - interval '1 hour 30 minutes', now() - interval '1 hour 25 minutes', now() - interval '1 hour 17 minutes'),
  ('aaaa0005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 5, NULL, 'no_show',
    now() - interval '1 hour 20 minutes', now() - interval '1 hour 15 minutes', NULL),
  ('aaaa0006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 6, '+919876543215', 'served',
    now() - interval '1 hour 10 minutes', now() - interval '1 hour 5 minutes', now() - interval '55 minutes');

insert into public.serving_stats (queue_id, ticket_id, duration_seconds) values
  ('22222222-2222-2222-2222-222222222222', 'aaaa0001-0000-0000-0000-000000000001', 300),
  ('22222222-2222-2222-2222-222222222222', 'aaaa0002-0000-0000-0000-000000000002', 420),
  ('22222222-2222-2222-2222-222222222222', 'aaaa0003-0000-0000-0000-000000000003', 300),
  ('22222222-2222-2222-2222-222222222222', 'aaaa0004-0000-0000-0000-000000000004', 480),
  ('22222222-2222-2222-2222-222222222222', 'aaaa0006-0000-0000-0000-000000000006', 600);

-- Currently waiting customers
insert into public.tickets (id, queue_id, token_number, customer_phone, status, joined_at) values
  ('bbbb0001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 7, '+919876543216', 'waiting',
    now() - interval '10 minutes'),
  ('bbbb0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 8, NULL, 'waiting',
    now() - interval '5 minutes'),
  ('bbbb0003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 9, '+919876543218', 'waiting',
    now() - interval '2 minutes');
