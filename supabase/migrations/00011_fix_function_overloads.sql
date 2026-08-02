-- CUELY — MIGRATION 00011: FIX FUNCTION OVERLOADS
-- Run this file in the Supabase SQL Editor to resolve ambiguous function call errors.

-- 1. Drop old join_queue signatures
DROP FUNCTION IF EXISTS public.join_queue(uuid, text);
DROP FUNCTION IF EXISTS public.join_queue(uuid, text, text);

-- 2. Drop old book_appointment signatures
DROP FUNCTION IF EXISTS public.book_appointment(uuid, text, text, date, time);

-- 3. Drop old add_manual_ticket signatures
DROP FUNCTION IF EXISTS public.add_manual_ticket(uuid, text, int);
