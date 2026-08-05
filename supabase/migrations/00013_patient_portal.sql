-- ============================================================
-- CUELY — PATIENT PORTAL (PHASE 1 / MVP)
-- ============================================================
-- Phone + OTP login, session persistence, auto-created profiles
-- when a patient joins a queue or books an appointment.
-- Run this file in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA
-- ============================================================

-- 1.1 Patient profiles (auto-created from tickets/appointments by phone)
create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  email text,
  notification_prefs jsonb not null default '{"sms": true, "whatsapp": true, "email": false}',
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- 1.2 One-time passcodes (OTP)
create table if not exists public.patient_otps (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_patient_otps_phone on public.patient_otps (phone, created_at desc);

-- 1.3 Portal sessions (device-bound persistence)
create table if not exists public.patient_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_patient_sessions_patient on public.patient_sessions (patient_id);

-- 1.4 Bills (basic — amount + payment status per visit)
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete cascade,
  patient_phone text,
  amount numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('paid', 'pending')),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_bills_patient on public.bills (patient_phone);

-- 1.5 Link ratings to the patient who gave them (for "My Ratings")
alter table public.ratings add column if not exists patient_phone text;

-- ============================================================
-- PART 2: ROW LEVEL SECURITY
-- ============================================================
-- Portal tables stay locked down: no anon policies. Access is only via
-- SECURITY DEFINER RPCs (OTP flow) or the server-side service-role client
-- after a session token is validated. Ownership is enforced at the API layer.

alter table public.patient_profiles enable row level security;
alter table public.patient_otps enable row level security;
alter table public.patient_sessions enable row level security;

-- Bills: admins read/update their own business's bills.
alter table public.bills enable row level security;
drop policy if exists "Admins can read own bills" on public.bills;
create policy "Admins can read own bills" on public.bills for select
  using (public.is_admin_of_business(business_id));
drop policy if exists "System can insert bills" on public.bills;
create policy "System can insert bills" on public.bills for insert with check (true);
drop policy if exists "Admins can update own bills" on public.bills;
create policy "Admins can update own bills" on public.bills for update
  using (public.is_admin_of_business(business_id));

-- ============================================================
-- PART 3: OTP + SESSION FUNCTIONS
-- ============================================================

-- 3.1 Create/update a profile by phone (called on join + booking + login)
create or replace function public.ensure_patient_profile(p_phone text, p_name text default null)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  if p_phone is null or trim(p_phone) = '' then
    return null;
  end if;
  insert into public.patient_profiles (phone, name)
  values (p_phone, nullif(trim(p_name), ''))
  on conflict (phone) do update
    set name = coalesce(public.patient_profiles.name, excluded.name)
  returning id into v_id;
  return v_id;
end; $$;

-- 3.2 Issue a 6-digit code (10 min expiry, 30s resend cooldown)
create or replace function public.request_patient_otp(p_phone text)
returns jsonb language plpgsql security definer as $$
declare
  v_code text;
  v_expires timestamptz;
  v_last timestamptz;
begin
  if p_phone is null or length(trim(p_phone)) < 8 then
    raise exception 'Please enter a valid phone number' using errcode = 'P0003';
  end if;

  select max(created_at) into v_last from public.patient_otps where phone = p_phone;
  if v_last is not null and v_last > now() - interval '30 seconds' then
    raise exception 'Please wait a moment before requesting a new code' using errcode = 'P0003';
  end if;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expires := now() + interval '10 minutes';

  insert into public.patient_otps (phone, code, expires_at)
  values (p_phone, v_code, v_expires);

  return jsonb_build_object('success', true, 'expires_at', v_expires, 'code', v_code);
end; $$;

-- 3.3 Verify the code, auto-create the profile, and mint a session token
create or replace function public.verify_patient_otp(p_phone text, p_code text)
returns jsonb language plpgsql security definer as $$
declare
  v_otp record;
  v_patient_id uuid;
  v_token text;
begin
  select * into v_otp from public.patient_otps
    where phone = p_phone and used_at is null
    order by created_at desc limit 1 for update;

  if not found then
    raise exception 'No active code found. Please request a new one.' using errcode = 'P0003';
  end if;

  if v_otp.code <> p_code then
    update public.patient_otps set attempts = attempts + 1 where id = v_otp.id;
    if v_otp.attempts + 1 >= 5 then
      update public.patient_otps set used_at = now() where id = v_otp.id;
    end if;
    raise exception 'Invalid code. Please try again.' using errcode = 'P0003';
  end if;

  if v_otp.expires_at < now() then
    raise exception 'This code has expired. Please request a new one.' using errcode = 'P0003';
  end if;

  update public.patient_otps set used_at = now() where id = v_otp.id;

  select id into v_patient_id from public.patient_profiles where phone = p_phone;
  if v_patient_id is null then
    insert into public.patient_profiles (phone) values (p_phone) returning id into v_patient_id;
  end if;

  update public.patient_profiles set last_login_at = now() where id = v_patient_id;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.patient_sessions (patient_id, token, expires_at)
  values (v_patient_id, v_token, now() + interval '30 days');

  return jsonb_build_object('token', v_token, 'patient_id', v_patient_id, 'phone', p_phone);
end; $$;

-- 3.4 Revoke a session (logout)
create or replace function public.revoke_patient_session(p_token text)
returns jsonb language plpgsql security definer as $$
begin
  delete from public.patient_sessions where token = p_token;
  return jsonb_build_object('success', true);
end; $$;

-- ============================================================
-- PART 4: APPOINTMENT RESCHEDULE
-- ============================================================

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_date date,
  p_new_time time default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_app record;
begin
  select * into v_app from public.appointments where id = p_appointment_id;
  if not found then raise exception 'Appointment not found' using errcode = 'P0002'; end if;
  if v_app.status <> 'scheduled' then
    raise exception 'Only upcoming appointments can be rescheduled' using errcode = 'P0003';
  end if;

  update public.appointments
    set appointment_date = p_new_date, appointment_time = p_new_time
    where id = p_appointment_id;

  return jsonb_build_object(
    'appointment_id', p_appointment_id,
    'appointment_date', p_new_date,
    'appointment_time', p_new_time,
    'status', 'scheduled'
  );
end; $$;

-- ============================================================
-- PART 5: AUTO-CREATE PROFILE ON JOIN & BOOKING
-- ============================================================

-- 5.1 join_queue (drops old signatures to avoid overload ambiguity)
drop function if exists public.join_queue(uuid);
drop function if exists public.join_queue(uuid, text, text, text);

create or replace function public.join_queue(
  p_queue_id uuid,
  p_name text default null,
  p_phone text default null,
  p_emergency_type text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_queue record;
  v_token int;
  v_ticket_id uuid;
  v_position int;
  v_estimated_wait int;
  v_today date := current_date;
begin
  select * into v_queue from public.queues where id = p_queue_id and is_active = true;
  if not found then raise exception 'Queue not found or is inactive' using errcode = 'P0002'; end if;

  if v_queue.is_paused is true then
    raise exception 'Queue is currently paused' using errcode = 'P0003';
  end if;

  select coalesce(max(token_number), 0) + 1 into v_token from public.tickets
    where queue_id = p_queue_id and joined_at::date = v_today;

  insert into public.tickets (queue_id, token_number, customer_name, customer_phone, status, emergency_type)
    values (p_queue_id, v_token, p_name, p_phone, 'waiting', p_emergency_type) returning id into v_ticket_id;

  -- Auto-create the patient's portal profile (no signup step needed)
  perform public.ensure_patient_profile(p_phone, p_name);

  select count(*) into v_position from public.tickets
    where queue_id = p_queue_id and status in ('waiting', 'called') and id != v_ticket_id;

  select public.estimate_wait(p_queue_id, v_position) into v_estimated_wait;

  return jsonb_build_object(
    'ticket_id', v_ticket_id,
    'token_number', v_token,
    'queue_name', v_queue.name,
    'position', v_position,
    'estimated_wait_seconds', v_estimated_wait
  );
end; $$;

-- 5.2 book_appointment
drop function if exists public.book_appointment(uuid, text, text, text, date, time);

create or replace function public.book_appointment(
  p_queue_id uuid,
  p_name text default null,
  p_phone text default null,
  p_emergency_type text default null,
  p_date date default current_date,
  p_time time default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_queue record;
  v_appointment_id uuid;
begin
  select * into v_queue from public.queues where id = p_queue_id;
  if not found then raise exception 'Queue not found' using errcode = 'P0002'; end if;

  insert into public.appointments (business_id, queue_id, patient_name, patient_phone, emergency_type, appointment_date, appointment_time, status)
    values (v_queue.business_id, p_queue_id, p_name, p_phone, p_emergency_type, p_date, p_time, 'scheduled')
    returning id into v_appointment_id;

  -- Auto-create the patient's portal profile (no signup step needed)
  perform public.ensure_patient_profile(p_phone, p_name);

  return jsonb_build_object(
    'appointment_id', v_appointment_id,
    'appointment_date', p_date,
    'appointment_time', p_time,
    'queue_name', v_queue.name
  );
end; $$;

-- ============================================================
-- PART 6: SUBMIT RATING WITH PATIENT PHONE
-- ============================================================

drop function if exists public.submit_rating(uuid, integer, text, text, text);

create or replace function public.submit_rating(
  p_queue_id uuid,
  p_rating_value integer,
  p_ticket_id text default null,
  p_patient_name text default null,
  p_comment text default null,
  p_patient_phone text default null
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

  insert into public.ratings (queue_id, ticket_id, rating_value, patient_name, comment, patient_phone)
    values (p_queue_id, p_ticket_id, p_rating_value, p_patient_name, p_comment, p_patient_phone);

  select avg_rating, total_ratings into v_avg, v_total
    from public.queues where id = p_queue_id;

  return jsonb_build_object(
    'queue_id', p_queue_id,
    'avg_rating', v_avg,
    'total_ratings', v_total
  );
end; $$;
