-- ============================================================
-- CUELY — PHASE 2.5 EXTENSIONS
-- ============================================================

-- 1. Table Alterations
ALTER TABLE public.tickets ADD COLUMN priority int NOT NULL DEFAULT 0;
ALTER TABLE public.tickets ADD COLUMN recall_count int NOT NULL DEFAULT 0;
ALTER TABLE public.tickets ADD COLUMN served_by uuid REFERENCES public.admins(id) ON DELETE SET NULL;

ALTER TABLE public.queues ADD COLUMN is_paused boolean NOT NULL DEFAULT false;

-- 2. New Table: queue_activity_log
CREATE TABLE IF NOT EXISTS public.queue_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for queue_activity_log
ALTER TABLE public.queue_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read own business activity" ON public.queue_activity_log FOR SELECT
  USING (public.is_admin_of_business(public.get_business_id_for_queue(queue_id)));
CREATE POLICY "Allow insert via RPCs" ON public.queue_activity_log FOR INSERT WITH CHECK (true);

-- 3. RPC Additions & Updates

-- Update join_queue to support manual entry (priority) and respect is_paused
CREATE OR REPLACE FUNCTION public.add_manual_ticket(p_queue_id uuid, p_phone text, p_priority int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue record; v_token int; v_ticket_id uuid; v_position int; v_estimated_wait int;
  v_today date := current_date;
BEGIN
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found' USING errcode = 'P0002'; END IF;
  IF NOT public.is_admin_of_business(v_queue.business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; 
  END IF;

  SELECT coalesce(max(token_number), 0) + 1 INTO v_token FROM public.tickets
    WHERE queue_id = p_queue_id AND joined_at::date = v_today;
    
  INSERT INTO public.tickets (queue_id, token_number, customer_phone, status, priority)
    VALUES (p_queue_id, v_token, p_phone, 'waiting', p_priority) RETURNING id INTO v_ticket_id;
    
  SELECT count(*) INTO v_position FROM public.tickets
    WHERE queue_id = p_queue_id AND status IN ('waiting', 'called') AND id != v_ticket_id;
    
  SELECT public.estimate_wait(p_queue_id, v_position) INTO v_estimated_wait;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (p_queue_id, v_ticket_id, auth.uid(), 'manual_entry');
    
  RETURN jsonb_build_object('ticket_id', v_ticket_id, 'token_number', v_token,
    'queue_name', v_queue.name, 'position', v_position, 'estimated_wait_seconds', v_estimated_wait);
END; $$;

-- Update original join_queue to reject if paused
CREATE OR REPLACE FUNCTION public.join_queue(p_queue_id uuid, p_phone text default null)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue record; v_token int; v_ticket_id uuid; v_position int; v_estimated_wait int;
  v_today date := current_date;
BEGIN
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found or is inactive' USING errcode = 'P0002'; END IF;
  
  IF v_queue.is_paused THEN
    RAISE EXCEPTION 'Queue is currently paused and not accepting new joins' USING errcode = 'P0004';
  END IF;

  SELECT coalesce(max(token_number), 0) + 1 INTO v_token FROM public.tickets
    WHERE queue_id = p_queue_id AND joined_at::date = v_today;
    
  INSERT INTO public.tickets (queue_id, token_number, customer_phone, status)
    VALUES (p_queue_id, v_token, p_phone, 'waiting') RETURNING id INTO v_ticket_id;
    
  SELECT count(*) INTO v_position FROM public.tickets
    WHERE queue_id = p_queue_id AND status IN ('waiting', 'called') AND id != v_ticket_id;
    
  SELECT public.estimate_wait(p_queue_id, v_position) INTO v_estimated_wait;
  
  RETURN jsonb_build_object('ticket_id', v_ticket_id, 'token_number', v_token,
    'queue_name', v_queue.name, 'position', v_position, 'estimated_wait_seconds', v_estimated_wait);
END; $$;


-- Bump Priority
CREATE OR REPLACE FUNCTION public.bump_priority(p_ticket_id uuid, p_new_priority int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid;
BEGIN
  SELECT t.*, q.business_id INTO v_ticket FROM public.tickets t
    JOIN public.queues q ON q.id = t.queue_id WHERE t.id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING errcode = 'P0002'; END IF;
  v_business_id := v_ticket.business_id;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;

  UPDATE public.tickets SET priority = p_new_priority WHERE id = p_ticket_id;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (v_ticket.queue_id, p_ticket_id, auth.uid(), 'bump_priority');

  RETURN jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'priority', p_new_priority);
END; $$;

-- Recall Ticket
CREATE OR REPLACE FUNCTION public.recall_ticket(p_ticket_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid;
BEGIN
  SELECT t.*, q.business_id INTO v_ticket FROM public.tickets t
    JOIN public.queues q ON q.id = t.queue_id WHERE t.id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING errcode = 'P0002'; END IF;
  v_business_id := v_ticket.business_id;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;

  IF v_ticket.status != 'called' THEN
    RAISE EXCEPTION 'Ticket must be in called status to recall' USING errcode = 'P0003'; END IF;

  UPDATE public.tickets SET recall_count = recall_count + 1, called_at = now() WHERE id = p_ticket_id;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (v_ticket.queue_id, p_ticket_id, auth.uid(), 'recall');

  RETURN jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'recall_count', v_ticket.recall_count + 1);
END; $$;


-- Update call_next (sort by priority, set served_by, log)
CREATE OR REPLACE FUNCTION public.call_next(p_queue_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid;
BEGIN
  SELECT business_id INTO v_business_id FROM public.queues WHERE id = p_queue_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found' USING errcode = 'P0002'; END IF;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;

  SELECT * INTO v_ticket FROM public.tickets WHERE queue_id = p_queue_id AND status = 'waiting'
    ORDER BY priority DESC, joined_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    
  IF NOT FOUND THEN RETURN jsonb_build_object('message', 'No one is waiting', 'ticket_id', null); END IF;
  
  UPDATE public.tickets SET status = 'called', called_at = now(), served_by = auth.uid() WHERE id = v_ticket.id;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (p_queue_id, v_ticket.id, auth.uid(), 'call_next');

  RETURN jsonb_build_object('ticket_id', v_ticket.id, 'token_number', v_ticket.token_number,
    'customer_phone', v_ticket.customer_phone, 'status', 'called');
END; $$;

-- Update mark_served to log
CREATE OR REPLACE FUNCTION public.mark_served(p_ticket_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid; v_duration int;
BEGIN
  SELECT t.*, q.business_id INTO v_ticket FROM public.tickets t
    JOIN public.queues q ON q.id = t.queue_id WHERE t.id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING errcode = 'P0002'; END IF;
  v_business_id := v_ticket.business_id;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;
  IF v_ticket.status != 'called' THEN
    RAISE EXCEPTION 'Ticket not in called status' USING errcode = 'P0003'; END IF;
    
  v_duration := extract(epoch from now() - v_ticket.called_at)::int;
  
  UPDATE public.tickets SET status = 'served', served_at = now() WHERE id = p_ticket_id;
  
  INSERT INTO public.serving_stats (queue_id, ticket_id, duration_seconds)
    VALUES (v_ticket.queue_id, p_ticket_id, v_duration);
    
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (v_ticket.queue_id, p_ticket_id, auth.uid(), 'mark_served');

  RETURN jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number,
    'duration_seconds', v_duration, 'status', 'served');
END; $$;

-- Update mark_no_show to log
CREATE OR REPLACE FUNCTION public.mark_no_show(p_ticket_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid;
BEGIN
  SELECT t.*, q.business_id INTO v_ticket FROM public.tickets t
    JOIN public.queues q ON q.id = t.queue_id WHERE t.id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING errcode = 'P0002'; END IF;
  v_business_id := v_ticket.business_id;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;
  IF v_ticket.status != 'called' THEN
    RAISE EXCEPTION 'Ticket not in called status' USING errcode = 'P0003'; END IF;
    
  UPDATE public.tickets SET status = 'no_show' WHERE id = p_ticket_id;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (v_ticket.queue_id, p_ticket_id, auth.uid(), 'mark_no_show');

  RETURN jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'status', 'no_show');
END; $$;


-- Undo Action
CREATE OR REPLACE FUNCTION public.undo_ticket_action(p_ticket_id uuid, p_revert_to_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_ticket record; v_business_id uuid;
BEGIN
  SELECT t.*, q.business_id INTO v_ticket FROM public.tickets t
    JOIN public.queues q ON q.id = t.queue_id WHERE t.id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found' USING errcode = 'P0002'; END IF;
  v_business_id := v_ticket.business_id;
  IF NOT public.is_admin_of_business(v_business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;

  -- Only allow undoing served or no_show back to called
  IF v_ticket.status NOT IN ('served', 'no_show') OR p_revert_to_status != 'called' THEN
    RAISE EXCEPTION 'Invalid undo operation' USING errcode = 'P0003'; END IF;

  UPDATE public.tickets SET status = p_revert_to_status WHERE id = p_ticket_id;
  
  IF v_ticket.status = 'served' THEN
    DELETE FROM public.serving_stats WHERE ticket_id = p_ticket_id;
  END IF;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (v_ticket.queue_id, p_ticket_id, auth.uid(), 'undo_action');

  RETURN jsonb_build_object('ticket_id', p_ticket_id, 'token_number', v_ticket.token_number, 'status', p_revert_to_status);
END; $$;


-- Toggle Queue Pause
CREATE OR REPLACE FUNCTION public.toggle_queue_pause(p_queue_id uuid, p_is_paused boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_queue record;
BEGIN
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found' USING errcode = 'P0002'; END IF;
  IF NOT public.is_admin_of_business(v_queue.business_id) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501'; END IF;

  -- Check role logic can be done client side and enforced here if needed, but keeping it simple: any admin can pause for now, or we can check role:
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND business_id = v_queue.business_id AND role = 'owner') THEN
    RAISE EXCEPTION 'Only owners can pause queues' USING errcode = '42501';
  END IF;

  UPDATE public.queues SET is_paused = p_is_paused WHERE id = p_queue_id;
  
  INSERT INTO public.queue_activity_log (queue_id, ticket_id, admin_id, action)
    VALUES (p_queue_id, null, auth.uid(), CASE WHEN p_is_paused THEN 'pause_queue' ELSE 'resume_queue' END);

  RETURN jsonb_build_object('queue_id', p_queue_id, 'is_paused', p_is_paused);
END; $$;
