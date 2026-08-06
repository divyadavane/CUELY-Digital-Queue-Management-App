-- ============================================================
-- 00018 — Availability & Schedule Management
-- Working hours, leave/block-time, slot capacity configs, audit log.
--
-- Doctors are represented by `queues` rows in this codebase, so every
-- schedule is scoped to a queue (the doctor's practice line). Schedules
-- are effective-dated: only the latest row (effective_from <= today)
-- drives slot generation, so "new hours next week" is a new row and
-- already-booked appointments are never touched.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Working hours (effective-dated, recurring weekly schedule)
-- ------------------------------------------------------------
create table if not exists public.doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  queue_id uuid references public.queues(id) on delete cascade,
  doctor_name text,
  title text not null default 'Default',
  effective_from date not null default current_date,
  effective_to date,
  timezone text not null default 'Asia/Kolkata',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.doctor_schedules.effective_from is
  'First day this schedule applies. The row with the latest effective_from <= today wins.';
comment on column public.doctor_schedules.effective_to is
  'Last day this schedule applies. NULL means it stays active until replaced.';

-- A schedule has multiple shifts per day (split schedules / breaks).
create table if not exists public.doctor_schedule_shifts (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.doctor_schedules(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun .. 6=Sat (JS getDay)
  start_time time not null,
  end_time time not null,
  slot_duration_mins int not null default 15,
  buffer_mins int not null default 0,
  max_patients int not null default 20,
  is_active boolean not null default true
);

create index if not exists doctor_schedules_queue_idx on public.doctor_schedules(queue_id);
create index if not exists doctor_schedule_shifts_schedule_idx on public.doctor_schedule_shifts(schedule_id);

-- ------------------------------------------------------------
-- 2. Slot capacity per appointment type (under a doctor / queue)
-- ------------------------------------------------------------
create table if not exists public.slot_configs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  queue_id uuid references public.queues(id) on delete cascade,
  appointment_type text not null default 'routine'
    check (appointment_type in ('routine','urgent','critical','follow_up','other')),
  duration_mins int not null default 15,
  buffer_mins int not null default 0,
  overbooking int not null default 1, -- patients allowed in the same slot (walk-in buffer)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (queue_id, appointment_type)
);

-- ------------------------------------------------------------
-- 3. Leave / block-time
-- ------------------------------------------------------------
create table if not exists public.leave_blocks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  queue_id uuid references public.queues(id) on delete cascade, -- null => business-wide block
  doctor_name text,
  title text not null,
  block_type text not null default 'full_day'
    check (block_type in ('full_day','partial')),
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  recurrence text not null default 'none'
    check (recurrence in ('none','weekly')),
  recurring_days int[] not null default '{}', -- 0..6; empty => every weekday when weekly
  status text not null default 'confirmed'
    check (status in ('pending','confirmed','cancelled')),
  notes text,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leave_blocks_queue_date_idx on public.leave_blocks(queue_id, start_date, end_date);
create index if not exists leave_blocks_business_idx on public.leave_blocks(business_id);

-- ------------------------------------------------------------
-- 4. Audit log (who created/modified/removed schedule objects)
-- ------------------------------------------------------------
create table if not exists public.schedule_audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  entity_type text not null, -- working_hours | leave_block | slot_config
  entity_id uuid not null,
  action text not null,      -- create | update | delete
  actor_id uuid,
  actor_name text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists schedule_audit_log_entity_idx on public.schedule_audit_log(entity_type, entity_id);

-- ------------------------------------------------------------
-- 5. RLS
-- Writes happen only through service-role API routes (which bypass RLS);
-- the policies below let authenticated admins read directly and public
-- availability reads pass through anon.
-- ------------------------------------------------------------
alter table public.doctor_schedules enable row level security;
alter table public.doctor_schedule_shifts enable row level security;
alter table public.slot_configs enable row level security;
alter table public.leave_blocks enable row level security;
alter table public.schedule_audit_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'doctor_schedules' and policyname = 'read_doctor_schedules') then
    create policy read_doctor_schedules on public.doctor_schedules for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doctor_schedules' and policyname = 'write_doctor_schedules') then
    create policy write_doctor_schedules on public.doctor_schedules for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doctor_schedule_shifts' and policyname = 'read_doctor_schedule_shifts') then
    create policy read_doctor_schedule_shifts on public.doctor_schedule_shifts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doctor_schedule_shifts' and policyname = 'write_doctor_schedule_shifts') then
    create policy write_doctor_schedule_shifts on public.doctor_schedule_shifts for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'slot_configs' and policyname = 'read_slot_configs') then
    create policy read_slot_configs on public.slot_configs for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'slot_configs' and policyname = 'write_slot_configs') then
    create policy write_slot_configs on public.slot_configs for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leave_blocks' and policyname = 'read_leave_blocks') then
    create policy read_leave_blocks on public.leave_blocks for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'leave_blocks' and policyname = 'write_leave_blocks') then
    create policy write_leave_blocks on public.leave_blocks for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'schedule_audit_log' and policyname = 'read_schedule_audit_log') then
    create policy read_schedule_audit_log on public.schedule_audit_log for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'schedule_audit_log' and policyname = 'insert_schedule_audit_log') then
    create policy insert_schedule_audit_log on public.schedule_audit_log for insert with check (true);
  end if;
end $$;

-- ------------------------------------------------------------
-- 6. Backfill default slot configs for existing queues
-- ------------------------------------------------------------
insert into public.slot_configs (business_id, queue_id, appointment_type, duration_mins, overbooking)
select q.business_id, q.id, 'routine', 15, 1
from public.queues q
on conflict (queue_id, appointment_type) do nothing;
