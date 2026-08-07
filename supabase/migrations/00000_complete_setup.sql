-- ============================================================
-- CUELY — COMPLETE BACKEND SETUP
-- ============================================================
-- Run this SINGLE file in the Supabase SQL Editor to set up
-- the entire backend in one go.
--
-- Project: https://uncnpqrbstmjrqewxoao.supabase.co
-- Dashboard SQL Editor: https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================


-- ============================================================
-- PART 1: SCHEMA — 5 Core Tables
-- ============================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.queues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  token_number int not null,
  customer_phone text,
  status text not null default 'waiting'
    check (status in ('waiting', 'called', 'serving', 'served', 'no_show', 'left')),
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  served_at timestamptz
);

create table if not exists public.serving_stats (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  duration_seconds int not null,
  recorded_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_tickets_queue_status on public.tickets (queue_id, status);
create index if not exists idx_tickets_queue_token on public.tickets (queue_id, token_number);
create index if not exists idx_tickets_joined_at on public.tickets (queue_id, joined_at);
create index if not exists idx_serving_stats_queue_recorded on public.serving_stats (queue_id, recorded_at desc);


-- ============================================================
-- PART 2: WAIT-TIME ESTIMATION FUNCTION
-- ============================================================

drop function if exists public.estimate_wait(uuid, int);
create or replace function public.estimate_wait(p_queue_id uuid, p_position int)
returns int language plpgsql stable security definer as $$
declare
  v_avg_duration int; v_sample_count int;
  v_default_duration constant int := 300;
  v_min_samples constant int := 3;
  v_lookback constant int := 8;
begin
  select count(*), coalesce(avg(duration_seconds)::int, v_default_duration)
    into v_sample_count, v_avg_duration
    from (select duration_seconds from public.serving_stats
          where queue_id = p_queue_id order by recorded_at desc limit v_lookback) recent;
  if v_sample_count < v_min_samples then v_avg_duration := v_default_duration; end if;
  return p_position * v_avg_duration;
end; $$;


-- ============================================================
-- PART 3: RLS HELPER FUNCTIONS + POLICIES
-- ============================================================

create or replace function public.is_admin_of_business(p_business_id uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.admins where id = auth.uid() and business_id = p_business_id);
$$;

create or replace function public.get_business_id_for_queue(p_queue_id uuid)
returns uuid language sql stable security definer as $$
  select business_id from public.queues where id = p_queue_id limit 1;
$$;

-- BUSINESSES RLS
alter table public.businesses enable row level security;
drop policy if exists "Admins can read own business" on public.businesses;
create policy "Admins can read own business" on public.businesses for select
  using (exists (select 1 from public.admins where admins.id = auth.uid() and admins.business_id = businesses.id));

drop policy if exists "Owners can update own business" on public.businesses;
create policy "Owners can update own business" on public.businesses for update
  using (exists (select 1 from public.admins where admins.id = auth.uid() and admins.business_id = businesses.id and admins.role = 'owner'));

-- ADMINS RLS
alter table public.admins enable row level security;
drop policy if exists "Admins can read own business admins" on public.admins;
create policy "Admins can read own business admins" on public.admins for select
  using (id = auth.uid() or public.is_admin_of_business(business_id));

-- QUEUES RLS
alter table public.queues enable row level security;
drop policy if exists "Public can read active queues" on public.queues;
create policy "Public can read active queues" on public.queues for select using (is_active = true);

drop policy if exists "Admins can insert queues for own business" on public.queues;
create policy "Admins can insert queues for own business" on public.queues for insert with check (public.is_admin_of_business(business_id));

drop policy if exists "Admins can update own business queues" on public.queues;
create policy "Admins can update own business queues" on public.queues for update using (public.is_admin_of_business(business_id));

drop policy if exists "Admins can delete own business queues" on public.queues;
create policy "Admins can delete own business queues" on public.queues for delete using (public.is_admin_of_business(business_id));

-- TICKETS RLS
alter table public.tickets enable row level security;
drop policy if exists "Public can read queue tickets" on public.tickets;
create policy "Public can read queue tickets" on public.tickets for select using (true);

drop policy if exists "Allow insert via join_queue function" on public.tickets;
create policy "Allow insert via join_queue function" on public.tickets for insert with check (true);

drop policy if exists "Admins can update tickets for their business queues" on public.tickets;
create policy "Admins can update tickets for their business queues" on public.tickets for update
  using (public.is_admin_of_business(public.get_business_id_for_queue(queue_id)));

-- SERVING_STATS RLS
alter table public.serving_stats enable row level security;
drop policy if exists "Admins can read own business stats" on public.serving_stats;
create policy "Admins can read own business stats" on public.serving_stats for select
  using (public.is_admin_of_business(public.get_business_id_for_queue(queue_id)));

drop policy if exists "Allow insert via mark_served function" on public.serving_stats;
create policy "Allow insert via mark_served function" on public.serving_stats for insert with check (true);


-- ============================================================
-- PART 4: CORE RPC FUNCTIONS
-- ============================================================

drop function if exists public.join_queue(uuid, text);
create or replace function public.join_queue(p_queue_id uuid, p_phone text default null)
returns jsonb language plpgsql security definer as $$
declare
  v_queue record; v_token int; v_ticket_id uuid; v_position int; v_estimated_wait int;
  v_today date := current_date;
begin
  select * into v_queue from public.queues where id = p_queue_id and is_active = true;
  if not found then raise exception 'Queue not found or is inactive' using errcode = 'P0002'; end if;
  select coalesce(max(token_number), 0) + 1 into v_token from public.tickets
    where queue_id = p_queue_id and joined_at::date = v_today;
  insert into public.tickets (queue_id, token_number, customer_phone, status)
    values (p_queue_id, v_token, p_phone, 'waiting') returning id into v_ticket_id;
  select count(*) into v_position from public.tickets
    where queue_id = p_queue_id and status in ('waiting', 'called') and id != v_ticket_id;
  select public.estimate_wait(p_queue_id, v_position) into v_estimated_wait;
  return jsonb_build_object('ticket_id', v_ticket_id, 'token_number', v_token,
    'queue_name', v_queue.name, 'position', v_position, 'estimated_wait_seconds', v_estimated_wait);
end; $$;

drop function if exists public.call_next(uuid);
create or replace function public.call_next(p_queue_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_ticket record; v_business_id uuid;
begin
  select business_id into v_business_id from public.queues where id = p_queue_id;
  if not found then raise exception 'Queue not found' using errcode = 'P0002'; end if;
  if not public.is_admin_of_business(v_business_id) then
    raise exception 'Unauthorized' using errcode = '42501'; end if;
  select * into v_ticket from public.tickets where queue_id = p_queue_id and status = 'waiting'
    order by joined_at asc limit 1 for update skip locked;
  if not found then return jsonb_build_object('message', 'No one is waiting', 'ticket_id', null); end if;
  update public.tickets set status = 'called', called_at = now() where id = v_ticket.id;
  return jsonb_build_object('ticket_id', v_ticket.id, 'token_number', v_ticket.token_number,
    'customer_phone', v_ticket.customer_phone, 'status', 'called');
end; $$;

drop function if exists public.mark_served(uuid);
create or replace function public.mark_served(p_ticket_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_ticket record; v_business_id uuid; v_duration int;
begin
  select t.*, q.business_id into v_ticket from public.tickets t
    join public.queues q on q.id = t.queue_id where t.id = p_ticket_id;
  if not found then raise exception 'Ticket not found' using errcode = 'P0002'; end if;
  v_business_id := v_ticket.business_id;
  if not public.is_admin_of_business(v_business_id) then
    raise exception 'Unauthorized' using errcode = '42501'; end if;
  if v_ticket.status != 'called' then
    raise exception 'Ticket not in called status' using errcode = 'P0003'; end if;
  v_duration := extract(epoch from now() - v_ticket.called_at)::int;
  update public.tickets set status = 'served', served_at = now() where id = p_ticket_id;
  insert into public.serving_stats (queue_id, ticket_id, duration_seconds)
    values (v_ticket.queue_id, p_ticket_id, v_duration);
  return jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number,
    'duration_seconds', v_duration, 'status', 'served');
end; $$;

drop function if exists public.mark_no_show(uuid);
create or replace function public.mark_no_show(p_ticket_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_ticket record; v_business_id uuid;
begin
  select t.*, q.business_id into v_ticket from public.tickets t
    join public.queues q on q.id = t.queue_id where t.id = p_ticket_id;
  if not found then raise exception 'Ticket not found' using errcode = 'P0002'; end if;
  v_business_id := v_ticket.business_id;
  if not public.is_admin_of_business(v_business_id) then
    raise exception 'Unauthorized' using errcode = '42501'; end if;
  if v_ticket.status != 'called' then
    raise exception 'Ticket not in called status' using errcode = 'P0003'; end if;
  update public.tickets set status = 'no_show' where id = p_ticket_id;
  return jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'status', 'no_show');
end; $$;

drop function if exists public.leave_queue(uuid);
create or replace function public.leave_queue(p_ticket_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_ticket record;
begin
  select * into v_ticket from public.tickets where id = p_ticket_id;
  if not found then raise exception 'Ticket not found' using errcode = 'P0002'; end if;
  if v_ticket.status != 'waiting' then
    raise exception 'Can only leave while waiting' using errcode = 'P0003'; end if;
  update public.tickets set status = 'left' where id = p_ticket_id;
  return jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'status', 'left');
end; $$;

drop function if exists public.get_queue_status(uuid);
create or replace function public.get_queue_status(p_queue_id uuid)
returns jsonb language plpgsql security definer as $$
declare v_queue record; v_total_waiting int; v_current_token int; v_avg_duration int;
begin
  select * into v_queue from public.queues where id = p_queue_id;
  if not found then raise exception 'Queue not found' using errcode = 'P0002'; end if;
  select count(*) into v_total_waiting from public.tickets where queue_id = p_queue_id and status = 'waiting';
  select token_number into v_current_token from public.tickets
    where queue_id = p_queue_id and status = 'called' order by called_at desc limit 1;
  select coalesce(avg(duration_seconds)::int, 300) into v_avg_duration
    from (select duration_seconds from public.serving_stats
          where queue_id = p_queue_id order by recorded_at desc limit 8) recent;
  return jsonb_build_object('queue_id', p_queue_id, 'queue_name', v_queue.name,
    'is_active', v_queue.is_active, 'total_waiting', v_total_waiting,
    'now_serving_token', v_current_token, 'avg_serving_seconds', v_avg_duration);
end; $$;


-- ============================================================
-- PART 5: ENABLE REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END $$;
