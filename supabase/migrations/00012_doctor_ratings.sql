-- ============================================================
-- CUELY — PHASE 5: DOCTOR RATINGS
-- ============================================================
-- Doctor = public.queues row (queue.doctor_name / queue.department).
-- Run this file in the Supabase SQL Editor.
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- 1. Aggregate rating columns on queues (fast reads)
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS avg_rating double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_ratings integer NOT NULL DEFAULT 0;

-- 2. Individual review records
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  ticket_id text,
  patient_name text,
  rating_value integer not null check (rating_value between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ratings_queue_created on public.ratings (queue_id, created_at desc);

-- One rating per completed visit (NULL ticket_id = anonymous, allowed multiple)
create unique index if not exists idx_ratings_ticket_unique on public.ratings (ticket_id) where ticket_id is not null;

-- 3. Trigger: recompute true average whenever a rating is inserted/updated/deleted
create or replace function public.refresh_rating_aggregates()
returns trigger language plpgsql as $$
declare
  v_queue_id uuid := coalesce(new.queue_id, old.queue_id);
  v_avg double precision;
  v_total integer;
begin
  select coalesce(avg(rating_value), 0), count(*)::int
    into v_avg, v_total
    from public.ratings where queue_id = v_queue_id;
  update public.queues
    set avg_rating = round(v_avg::numeric, 2),
        total_ratings = v_total
    where id = v_queue_id;
  return null;
end; $$;

drop trigger if exists trg_ratings_refresh_aggregates on public.ratings;
create trigger trg_ratings_refresh_aggregates
  after insert or update or delete on public.ratings
  for each row execute function public.refresh_rating_aggregates();

-- 4. Submit-rating RPC: enforces one rating per served visit, returns fresh aggregates
create or replace function public.submit_rating(
  p_queue_id uuid,
  p_rating_value integer,
  p_ticket_id text default null,
  p_patient_name text default null,
  p_comment text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_avg double precision;
  v_total integer;
begin
  if p_rating_value is null or p_rating_value < 1 or p_rating_value > 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = 'P0003';
  end if;

  if not exists (select 1 from public.queues where id = p_queue_id) then
    raise exception 'Queue not found' using errcode = 'P0002';
  end if;

  if p_ticket_id is not null and exists (select 1 from public.ratings where ticket_id = p_ticket_id) then
    raise exception 'You have already rated this visit' using errcode = 'P0004';
  end if;

  insert into public.ratings (queue_id, ticket_id, rating_value, patient_name, comment)
    values (p_queue_id, p_ticket_id, p_rating_value, p_patient_name, p_comment);

  -- Trigger already refreshed aggregates; read them back for the response
  select avg_rating, total_ratings into v_avg, v_total
    from public.queues where id = p_queue_id;

  return jsonb_build_object(
    'queue_id', p_queue_id,
    'avg_rating', v_avg,
    'total_ratings', v_total
  );
end; $$;

-- 5. Row Level Security
alter table public.ratings enable row level security;

-- Anyone can read ratings (public reviews)
drop policy if exists "Public can read ratings" on public.ratings;
create policy "Public can read ratings" on public.ratings for select using (true);

-- Direct inserts only allowed for a served ticket that hasn't been rated yet
drop policy if exists "Insert only via served ticket" on public.ratings;
create policy "Insert only via served ticket" on public.ratings for insert
  with check (
    exists (
      select 1 from public.tickets t
      where t.id::text = ratings.ticket_id
        and t.status = 'served'
    )
    and not exists (
      select 1 from public.ratings r where r.ticket_id = ratings.ticket_id
    )
  );

-- 6. Realtime (live sync of rating badges everywhere)
-- Guarded so this can be re-run safely without "already a member" errors.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime'
                   and schemaname = 'public'
                   and tablename = 'ratings') then
    alter publication supabase_realtime add table public.ratings;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime'
                   and schemaname = 'public'
                   and tablename = 'queues') then
    alter publication supabase_realtime add table public.queues;
  end if;
end $$;
