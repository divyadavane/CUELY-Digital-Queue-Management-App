-- ============================================================
-- CUELY - MULTI-LANGUAGE SUPPORT (schema)
-- ============================================================
-- Per-hospital default language + per-patient preferred language.
-- Run in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- 1.1 Hospital default language (used when a patient has no preference yet)
alter table public.businesses add column if not exists default_language text not null default 'en';

-- 1.2 Patient's preferred language (carries across visits/devices)
alter table public.patient_profiles add column if not exists preferred_language text not null default 'en';

-- 1.3 Public read of the default_language column (join page needs it without
-- auth to pick the hospital's language for anonymous patients).
drop policy if exists "Public can read default_language" on public.businesses;
create policy "Public can read default_language" on public.businesses for select using (true);

-- 1.4 Capture the patient's preferred language when they first sign in.
-- request_patient_otp now accepts an optional language hint. It is written
-- to the profile only on first creation (a later explicit preference is kept).
create or replace function public.request_patient_otp(p_phone text, p_language text default null)
returns jsonb language plpgsql security definer as $function$
declare
  v_code text;
  v_expires timestamptz;
  v_last timestamptz;
  v_lang text;
begin
  if p_phone is null or length(trim(p_phone)) < 8 then
    raise exception 'Please enter a valid phone number' using errcode = 'P0003';
  end if;

  select max(created_at) into v_last from public.patient_otps where phone = p_phone;
  if v_last is not null and v_last > now() - interval '30 seconds' then
    raise exception 'Please wait a moment before requesting a new code' using errcode = 'P0003';
  end if;

  v_lang := case when p_language in ('en', 'hi', 'mr') then p_language else 'en' end;

  insert into public.patient_profiles (phone, preferred_language)
  values (p_phone, v_lang)
  on conflict (phone) do nothing;

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expires := now() + interval '10 minutes';

  insert into public.patient_otps (phone, code, expires_at)
  values (p_phone, v_code, v_expires);

  return jsonb_build_object('success', true, 'expires_at', v_expires, 'code', v_code);
end;
$function$;
