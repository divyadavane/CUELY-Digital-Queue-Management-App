-- ============================================================
-- 00019 — Doctor-Side Dashboard Enhancements
--
-- Adds clinical/consultation tracking fields to `tickets` and an
-- assistance-request flag to `queues` so the doctor dashboard can show:
--   - patient-in-consultation panel (visit reason, insurance flag,
--     consult timing)
--   - consult timer + pacing (started/ended)
--   - urgency tags (emergency / walk-in / follow-up / vip)
--   - front-desk assistance request
-- ============================================================

-- ------------------------------------------------------------
-- 1. tickets: clinical & consult-timing fields
-- ------------------------------------------------------------
alter table public.tickets
  add column if not exists visit_reason text,
  add column if not exists clinical_note text,
  add column if not exists insurance_verified boolean not null default false,
  add column if not exists urgency_tag text,  -- emergency | walk-in | follow-up | vip
  add column if not exists consult_started_at timestamptz,
  add column if not exists consult_ended_at timestamptz;

comment on column public.tickets.visit_reason is
  'Patient-stated reason for the visit, captured at check-in or by staff.';
comment on column public.tickets.clinical_note is
  'Quick clinical note / dictation tied to the in-person consult.';
comment on column public.tickets.urgency_tag is
  'Stored urgency tag: emergency, walk-in, follow-up, vip (null = routine).';
comment on column public.tickets.consult_started_at is
  'When the doctor began the consultation (for timer & pacing).';
comment on column public.tickets.consult_ended_at is
  'When the consult was completed (duration = ended - started).';

-- Keep urgency_tag consistent with priority bumps: raising priority to
-- tier 2+ on a routine ticket is a manual flag; we do not auto-derive it.

-- ------------------------------------------------------------
-- 2. queues: front-desk assistance request flag
-- ------------------------------------------------------------
alter table public.queues
  add column if not exists assistance_requested_at timestamptz;

comment on column public.queues.assistance_requested_at is
  'Set when the doctor taps "Request front-desk assistance". Cleared by staff.';

-- ------------------------------------------------------------
-- 3. Doctor consult action function (single row update guard)
-- ------------------------------------------------------------
-- RPC to start a consult: sets consult_started_at if not already set.
create or replace function public.start_consult(p_ticket_id uuid)
returns json
language plpgsql security definer
as $$
declare
  v_ticket public.tickets%rowtype;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id;
  if not found then
    return json_build_object('success', false, 'error', 'Ticket not found');
  end if;
  update public.tickets
     set consult_started_at = coalesce(consult_started_at, now())
   where id = p_ticket_id;
  return json_build_object('success', true, 'ticket_id', p_ticket_id);
end;
$$;

-- RPC to complete a consult: stamps ended_at and marks the ticket served
-- via the existing mark_served logic (kept local so it is atomic).
create or replace function public.complete_consult(p_ticket_id uuid)
returns json
language plpgsql security definer
as $$
declare
  v_started timestamptz;
  v_seconds int;
begin
  select consult_started_at into v_started from public.tickets where id = p_ticket_id;
  if not found then
    return json_build_object('success', false, 'error', 'Ticket not found');
  end if;

  update public.tickets
     set consult_ended_at = now(),
         consult_started_at = coalesce(consult_started_at, now())
   where id = p_ticket_id
   returning (extract(epoch from (consult_ended_at - consult_started_at)))::int into v_seconds;

  -- record serving duration for analytics
  insert into public.serving_stats (queue_id, ticket_id, duration_seconds)
  select t.queue_id, t.id, coalesce(v_seconds, 0)
    from public.tickets t where t.id = p_ticket_id;

  -- mark served (mirrors the mark_served RPC behavior without recursion)
  update public.tickets
     set status = 'served', served_at = now()
   where id = p_ticket_id;

  return json_build_object('success', true, 'ticket_id', p_ticket_id, 'duration_seconds', v_seconds);
end;
$$;

-- RPC: doctor requests front-desk assistance for their queue.
create or replace function public.request_assistance(p_queue_id uuid)
returns json
language plpgsql security definer
as $$
begin
  update public.queues
     set assistance_requested_at = now()
   where id = p_queue_id;
  return json_build_object('success', true, 'queue_id', p_queue_id);
end;
$$;

-- RPC: staff clears the assistance request once handled.
create or replace function public.clear_assistance(p_queue_id uuid)
returns json
language plpgsql security definer
as $$
begin
  update public.queues
     set assistance_requested_at = null
   where id = p_queue_id;
  return json_build_object('success', true, 'queue_id', p_queue_id);
end;
$$;

-- ------------------------------------------------------------
-- 4. Pacing defaults: queues.avg_consult_mins (per-doctor consult target)
-- ------------------------------------------------------------
alter table public.queues
  add column if not exists avg_consult_mins int not null default 10;

comment on column public.queues.avg_consult_mins is
  'Target minutes per consult, used for pacing + wait-time prediction.';
