-- ============================================================
-- CUELY — BILLING FLOW
-- ============================================================
-- Auto-creates a bill the moment a ticket enters a queue (so billing
-- shows in the queue, on the doctor dashboard, and in the patient
-- portal immediately), plus a per-queue consultation fee and a
-- record of when each bill was paid.
-- Run after 00013_patient_portal.sql in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA
-- ============================================================

-- 1.1 Per-queue consultation fee (default ₹300 so billing works out of the box)
alter table public.queues add column if not exists consultation_fee numeric(10,2) not null default 300;

-- 1.2 Track when a bill was actually paid
alter table public.bills add column if not exists paid_at timestamptz;

-- ============================================================
-- PART 2: AUTO-CREATE BILL ON TICKET CREATION
-- ============================================================
-- Fires on every INSERT into tickets (join_queue, add_manual_ticket,
-- appointment check-in). Security definer bypasses RLS so the bill is
-- always written regardless of who inserted the ticket.

create or replace function public.create_bill_for_new_ticket()
returns trigger language plpgsql security definer as $$
declare
  v_business_id uuid;
  v_fee numeric;
begin
  -- Never double-bill a ticket
  if exists (select 1 from public.bills where ticket_id = new.id) then
    return new;
  end if;

  select q.business_id, coalesce(q.consultation_fee, 0)
    into v_business_id, v_fee
    from public.queues q
    where q.id = new.queue_id;

  if not found then
    return new;
  end if;

  insert into public.bills (business_id, ticket_id, patient_phone, amount, status, description)
  values (v_business_id, new.id, new.customer_phone, v_fee, 'pending', 'Consultation');

  return new;
end; $$;

drop trigger if exists trg_create_bill_on_ticket on public.tickets;
create trigger trg_create_bill_on_ticket
after insert on public.tickets
for each row execute function public.create_bill_for_new_ticket();

-- ============================================================
-- PART 3: BACKFILL
-- ============================================================

-- 3.1 Existing queues get the default consultation fee
update public.queues
  set consultation_fee = 300
  where consultation_fee is null or consultation_fee <= 0;

-- 3.2 Existing tickets (that matter for billing) get a bill
insert into public.bills (business_id, ticket_id, patient_phone, amount, status, description)
select q.business_id, t.id, t.customer_phone, coalesce(q.consultation_fee, 0), 'pending', 'Consultation'
from public.tickets t
join public.queues q on q.id = t.queue_id
where t.status in ('waiting', 'called', 'serving', 'served')
  and not exists (select 1 from public.bills b where b.ticket_id = t.id);
