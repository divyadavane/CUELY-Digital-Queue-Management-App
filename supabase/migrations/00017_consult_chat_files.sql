-- ============================================================
-- 00017 — Consultation chat + file uploads
-- Part 1: private storage bucket for consultation chat files.
-- Files are uploaded from API route handlers using the service role;
-- signed URLs are issued server-side so the browser never holds keys.
-- ============================================================

-- Idempotently create the private bucket. `public = false` keeps objects
-- readable only via signed URLs issued by an authorized server route.
-- (Supabase's default anon policies are scoped to the `public` bucket, so
-- anonymous clients cannot read or write here.)
insert into storage.buckets (id, name, public)
values ('consultation-chat', 'consultation-chat', false)
on conflict (id) do nothing;

-- ============================================================
-- Part 2: unread tracking for the consultation chat.
-- `read_at` is stamped when the receiving party opens the conversation, so
-- each side can show unread counts of the other's messages.
-- ============================================================
alter table public.consultation_chat
  add column if not exists read_at timestamptz;