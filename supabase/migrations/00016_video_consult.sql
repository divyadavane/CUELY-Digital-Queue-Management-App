-- ============================================================
-- CUELY - VIDEO CONSULTATION (telemedicine v1)
-- ============================================================
-- Online consultations: booking, secure meeting rooms (P2P WebRTC
-- with Supabase Realtime signaling), SOAP notes, prescriptions,
-- ratings. Run after 00015 in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA
-- ============================================================

-- 1.1 Queues opt into offering video consultations (doctor = queue row)
alter table public.queues add column if not exists video_enabled boolean not null default true;

-- 1.2 Appointments can be video type
alter table public.appointments add column if not exists is_video boolean not null default false;

-- 1.3 Core consultation record (1:1 doctor-patient meeting)
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  queue_id uuid not null references public.queues(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid references public.patient_profiles(id) on delete set null,
  patient_phone text not null,
  patient_name text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'ready', 'in_call', 'completed', 'cancelled', 'missed')),
  room_token text not null unique,
  scheduled_start timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_consultations_patient on public.consultations (patient_phone, scheduled_start desc);
create index if not exists idx_consultations_queue on public.consultations (queue_id, scheduled_start desc);

-- 1.4 SOAP consultation notes (autosaved by the doctor)
create table if not exists public.consultation_notes (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  subjective text not null default '',
  objective text not null default '',
  assessment text not null default '',
  plan text not null default '',
  updated_at timestamptz not null default now()
);

-- 1.5 Structured prescriptions
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  diagnosis text,
  medicine_items jsonb not null default '[]',
  lab_tests jsonb not null default '[]',
  follow_up_date date,
  notes text,
  created_by uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.6 In-consultation chat (messages; attachments arrive in phase 2)
create table if not exists public.consultation_chat (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null references public.consultations(id) on delete cascade,
  sender_role text not null check (sender_role in ('doctor', 'patient')),
  sender_name text,
  message text,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_consultation_chat_consultation on public.consultation_chat (consultation_id, created_at);

-- 1.7 Consultations can be rated (one per consultation, drives the same
-- doctor-rating aggregates already used for in-person visits)
alter table public.ratings add column if not exists consultation_id uuid references public.consultations(id) on delete set null;
create unique index if not exists idx_ratings_consultation_unique on public.ratings (consultation_id) where consultation_id is not null;

-- 1.8 Link the bill to the consultation so payment can gate the join room
alter table public.bills add column if not exists consultation_id uuid references public.consultations(id) on delete set null;
create index if not exists idx_bills_consultation on public.bills (consultation_id);

-- ============================================================
-- PART 2: RPCs (all security definer; patients reach these through
-- the service-role API layer, doctors through the admin API)
-- ============================================================

-- 2.1 Book a video consultation: appointment + consultation room + bill
-- (paid later through the existing Razorpay flow). Atomic.
create or replace function public.book_video_consultation(
  p_queue_id uuid,
  p_phone text,
  p_patient_id uuid default null,
  p_name text default null,
  p_date date default null,
  p_time time default null
)
returns jsonb language plpgsql security definer as $function$
declare
  v_queue public.queues%rowtype;
  v_appointment_id uuid;
  v_consultation_id uuid;
  v_start timestamptz;
  v_fee numeric;
begin
  if p_phone is null or length(trim(p_phone)) < 8 then
    raise exception 'Please enter a valid phone number' using errcode = 'P0003';
  end if;

  select * into v_queue from public.queues where id = p_queue_id and is_active = true;
  if not found then
    raise exception 'Queue not found or is inactive' using errcode = 'P0002';
  end if;
  if v_queue.video_enabled is not true then
    raise exception 'Video consultations are not available for this doctor' using errcode = 'P0003';
  end if;

  p_date := coalesce(p_date, current_date);
  p_time := coalesce(p_time, '09:00'::time);
  v_start := (p_date::text || ' ' || p_time::text)::timestamptz;
  if v_start < now() then
    raise exception 'Please pick a future date and time' using errcode = 'P0003';
  end if;

  if exists (
    select 1 from public.appointments a
    join public.consultations c on c.appointment_id = a.id
    where a.patient_phone = p_phone and a.is_video = true
      and c.status in ('scheduled', 'ready', 'in_call')
      and a.appointment_date = p_date and a.appointment_time = p_time
  ) then
    raise exception 'You already have a video consultation at this time' using errcode = 'P0003';
  end if;

  insert into public.appointments
    (business_id, queue_id, patient_name, patient_phone, appointment_date, appointment_time, status, is_video)
  values
    (v_queue.business_id, p_queue_id, p_name, p_phone, p_date, p_time, 'scheduled', true)
  returning id into v_appointment_id;

  insert into public.consultations
    (business_id, queue_id, appointment_id, patient_id, patient_phone, patient_name,
     status, room_token, scheduled_start, expires_at)
  values
    (v_queue.business_id, p_queue_id, v_appointment_id, p_patient_id, p_phone, p_name,
     'scheduled', encode(gen_random_bytes(24), 'hex'), v_start, v_start + interval '2 hours')
  returning id into v_consultation_id;

  v_fee := coalesce(v_queue.consultation_fee, 0);
  insert into public.bills
    (business_id, patient_phone, amount, status, description, consultation_id)
  values
    (v_queue.business_id, p_phone, v_fee, 'pending', 'Video Consultation', v_consultation_id);

  return jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'consultation_id', v_consultation_id,
    'scheduled_start', v_start,
    'fee', v_fee
  );
end; $function$;

-- 2.2 Transition a consultation's lifecycle status
create or replace function public.set_consultation_status(
  p_consultation_id uuid,
  p_status text
)
returns jsonb language plpgsql security definer as $function$
declare
  v_consultation public.consultations%rowtype;
begin
  select * into v_consultation from public.consultations where id = p_consultation_id;
  if not found then raise exception 'Consultation not found' using errcode = 'P0002'; end if;

  -- Allowed transitions
  if not (
    (v_consultation.status = 'scheduled' and p_status in ('ready', 'cancelled', 'missed')) or
    (v_consultation.status = 'ready' and p_status in ('in_call', 'cancelled', 'missed')) or
    (v_consultation.status in ('scheduled', 'ready') and p_status = 'in_call') or
    (v_consultation.status = 'in_call' and p_status = 'completed')
  ) then
    raise exception 'Invalid status transition' using errcode = 'P0003';
  end if;

  update public.consultations
    set status = p_status,
        started_at = case when p_status = 'in_call' and started_at is null then now() else started_at end,
        ended_at = case when p_status = 'completed' then now() else ended_at end,
        expires_at = case when p_status in ('completed', 'cancelled') then now() else expires_at end,
        updated_at = now()
    where id = p_consultation_id;

  return jsonb_build_object('success', true, 'consultation_id', p_consultation_id, 'status', p_status);
end; $function$;

-- 2.3 Autosave SOAP notes (upsert)
create or replace function public.save_consultation_notes(
  p_consultation_id uuid,
  p_subjective text default '',
  p_objective text default '',
  p_assessment text default '',
  p_plan text default ''
)
returns jsonb language plpgsql security definer as $function$
begin
  insert into public.consultation_notes (consultation_id, subjective, objective, assessment, plan)
  values (p_consultation_id, coalesce(p_subjective, ''), coalesce(p_objective, ''),
          coalesce(p_assessment, ''), coalesce(p_plan, ''))
  on conflict (consultation_id) do update
    set subjective = excluded.subjective,
        objective = excluded.objective,
        assessment = excluded.assessment,
        plan = excluded.plan,
        updated_at = now();
  return jsonb_build_object('success', true, 'consultation_id', p_consultation_id);
end; $function$;

-- 2.4 Create / update a prescription (upsert)
create or replace function public.save_prescription(
  p_consultation_id uuid,
  p_diagnosis text default null,
  p_medicine_items jsonb default '[]',
  p_lab_tests jsonb default '[]',
  p_follow_up_date date default null,
  p_notes text default null,
  p_created_by uuid default null
)
returns jsonb language plpgsql security definer as $function$
begin
  insert into public.prescriptions (consultation_id, diagnosis, medicine_items, lab_tests, follow_up_date, notes, created_by)
  values (p_consultation_id, p_diagnosis, coalesce(p_medicine_items, '[]'), coalesce(p_lab_tests, '[]'),
          p_follow_up_date, p_notes, p_created_by)
  on conflict (consultation_id) do update
    set diagnosis = excluded.diagnosis,
        medicine_items = excluded.medicine_items,
        lab_tests = excluded.lab_tests,
        follow_up_date = excluded.follow_up_date,
        notes = excluded.notes,
        created_by = excluded.created_by,
        updated_at = now();
  return jsonb_build_object('success', true, 'consultation_id', p_consultation_id);
end; $function$;

-- 2.5 Rate a completed video consultation (one per consultation)
create or replace function public.submit_consultation_rating(
  p_consultation_id uuid,
  p_rating_value integer,
  p_comment text default null
)
returns jsonb language plpgsql security definer as $function$
declare
  v_consultation public.consultations%rowtype;
  v_avg double precision;
  v_total integer;
begin
  select * into v_consultation from public.consultations where id = p_consultation_id;
  if not found then raise exception 'Consultation not found' using errcode = 'P0002'; end if;
  if v_consultation.status <> 'completed' then
    raise exception 'You can only rate a completed consultation' using errcode = 'P0003';
  end if;
  if p_rating_value is null or p_rating_value < 1 or p_rating_value > 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = 'P0003';
  end if;
  if exists (select 1 from public.ratings where consultation_id = p_consultation_id) then
    raise exception 'You have already rated this consultation' using errcode = 'P0004';
  end if;

  insert into public.ratings (queue_id, consultation_id, rating_value, comment)
  values (v_consultation.queue_id, p_consultation_id, p_rating_value, p_comment);

  select avg_rating, total_ratings into v_avg, v_total
    from public.queues where id = v_consultation.queue_id;

  return jsonb_build_object('success', true, 'avg_rating', v_avg, 'total_ratings', v_total);
end; $function$;

-- ============================================================
-- PART 3: ROW LEVEL SECURITY (defense in depth; the API layer
-- already validates portal sessions / admin ownership)
-- ============================================================

alter table public.consultations enable row level security;
alter table public.consultation_notes enable row level security;
alter table public.prescriptions enable row level security;
alter table public.consultation_chat enable row level security;

drop policy if exists "Admins can read own consultations" on public.consultations;
create policy "Admins can read own consultations" on public.consultations for select
  using (public.is_admin_of_business(business_id));

drop policy if exists "Admins can update own consultations" on public.consultations;
create policy "Admins can update own consultations" on public.consultations for update
  using (public.is_admin_of_business(business_id));

drop policy if exists "Admins can read own consultation notes" on public.consultation_notes;
create policy "Admins can read own consultation notes" on public.consultation_notes for select
  using (exists (
    select 1 from public.consultations c where c.id = consultation_id and public.is_admin_of_business(c.business_id)
  ));

drop policy if exists "Admins can update own consultation notes" on public.consultation_notes;
create policy "Admins can update own consultation notes" on public.consultation_notes for update
  using (exists (
    select 1 from public.consultations c where c.id = consultation_id and public.is_admin_of_business(c.business_id)
  ));

drop policy if exists "Admins can read own prescriptions" on public.prescriptions;
create policy "Admins can read own prescriptions" on public.prescriptions for select
  using (exists (
    select 1 from public.consultations c where c.id = consultation_id and public.is_admin_of_business(c.business_id)
  ));

drop policy if exists "Admins can update own prescriptions" on public.prescriptions;
create policy "Admins can update own prescriptions" on public.prescriptions for update
  using (exists (
    select 1 from public.consultations c where c.id = consultation_id and public.is_admin_of_business(c.business_id)
  ));

drop policy if exists "Admins can read own consultation chat" on public.consultation_chat;
create policy "Admins can read own consultation chat" on public.consultation_chat for select
  using (exists (
    select 1 from public.consultations c where c.id = consultation_id and public.is_admin_of_business(c.business_id)
  ));

-- ============================================================
-- PART 4: REALTIME
-- ============================================================

do $realtime$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime'
                   and schemaname = 'public'
                   and tablename = 'consultations') then
    alter publication supabase_realtime add table public.consultations;
  end if;
end; $realtime$;
