-- ============================================================
-- CUELY — MULTI-LANGUAGE SUPPORT (schema)
-- ============================================================
-- Per-hospital default language + per-patient preferred language.
-- Run in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uncnpqrbstmjrqewxoao/sql/new
-- ============================================================

-- 1.1 Hospital default language (used when a patient has no preference yet)
alter table public.businesses add column if not exists default_language text not null default 'en';

-- 1.2 Patient's preferred language (carries across visits/devices)
alter table public.patient_profiles add column if not exists preferred_language text not null default 'en';
