-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Index for quick lookups by ticket
create index if not exists idx_push_subscriptions_ticket on public.push_subscriptions(ticket_id);

-- Add notification_method to tickets (default display_only for kiosk)
alter table public.tickets
add column if not exists notification_method text not null default 'display_only'
check (notification_method in ('push', 'whatsapp', 'sms', 'display_only'));

-- Update existing tickets to default to whatsapp since that was the previous flow
update public.tickets set notification_method = 'whatsapp' where notification_method = 'display_only';
