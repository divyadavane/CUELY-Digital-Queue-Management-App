-- ============================================================
-- CUELY — Phase 3: Patient Features
-- ============================================================

-- Function: leave_queue
-- Description: Allows a patient to leave the queue. Sets ticket status to 'left'.
drop function if exists public.leave_queue(uuid);

create or replace function public.leave_queue(
  p_ticket_id uuid
) returns json
language plpgsql security definer
as $$
declare
  v_result json;
begin
  update public.tickets
  set status = 'left'
  where id = p_ticket_id
  and status = 'waiting';

  v_result := json_build_object('success', true);
  return v_result;
end;
$$;
