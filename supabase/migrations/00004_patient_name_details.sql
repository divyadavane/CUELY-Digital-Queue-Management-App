-- ============================================================
-- CUELY — MIGRATION 00004: PATIENT NAME & DETAILS
-- ============================================================

-- 1. Alter Tables
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_name text;

-- 2. Update join_queue RPC to accept p_name
CREATE OR REPLACE FUNCTION public.join_queue(
  p_queue_id uuid,
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_emergency_type text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue record;
  v_token int;
  v_ticket_id uuid;
  v_position int;
  v_estimated_wait int;
  v_today date := current_date;
BEGIN
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found or is inactive' USING errcode = 'P0002'; END IF;

  IF v_queue.is_paused IS TRUE THEN
    RAISE EXCEPTION 'Queue is currently paused' USING errcode = 'P0003';
  END IF;

  SELECT coalesce(max(token_number), 0) + 1 INTO v_token FROM public.tickets
    WHERE queue_id = p_queue_id AND joined_at::date = v_today;

  INSERT INTO public.tickets (queue_id, token_number, customer_name, customer_phone, status, emergency_type)
    VALUES (p_queue_id, v_token, p_name, p_phone, 'waiting', p_emergency_type) RETURNING id INTO v_ticket_id;

  SELECT count(*) INTO v_position FROM public.tickets
    WHERE queue_id = p_queue_id AND status IN ('waiting', 'called') AND id != v_ticket_id;

  SELECT public.estimate_wait(p_queue_id, v_position) INTO v_estimated_wait;

  RETURN jsonb_build_object(
    'ticket_id', v_ticket_id,
    'token_number', v_token,
    'queue_name', v_queue.name,
    'position', v_position,
    'estimated_wait_seconds', v_estimated_wait
  );
END; $$;

-- 3. Update book_appointment RPC to accept p_name
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_queue_id uuid,
  p_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_emergency_type text DEFAULT NULL,
  p_date date DEFAULT current_date,
  p_time time DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue record;
  v_appointment_id uuid;
BEGIN
  SELECT * INTO v_queue FROM public.queues WHERE id = p_queue_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Queue not found' USING errcode = 'P0002'; END IF;

  INSERT INTO public.appointments (business_id, queue_id, patient_name, patient_phone, emergency_type, appointment_date, appointment_time, status)
    VALUES (v_queue.business_id, p_queue_id, p_name, p_phone, p_emergency_type, p_date, p_time, 'scheduled')
    RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'appointment_date', p_date,
    'appointment_time', p_time,
    'queue_name', v_queue.name
  );
END; $$;

-- 4. Update check_in_appointment RPC to pass patient_name
CREATE OR REPLACE FUNCTION public.check_in_appointment(p_appointment_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app record;
  v_join_result jsonb;
BEGIN
  SELECT * INTO v_app FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Appointment not found' USING errcode = 'P0002'; END IF;
  IF v_app.status != 'scheduled' THEN
    RAISE EXCEPTION 'Appointment is not in scheduled status' USING errcode = 'P0003';
  END IF;

  v_join_result := public.join_queue(v_app.queue_id, v_app.patient_name, v_app.patient_phone, v_app.emergency_type);

  UPDATE public.appointments SET status = 'checked_in' WHERE id = p_appointment_id;

  RETURN v_join_result;
END; $$;

-- 5. Update add_manual_ticket RPC to accept p_name
CREATE OR REPLACE FUNCTION public.add_manual_ticket(
  p_queue_id uuid,
  p_phone text DEFAULT NULL,
  p_priority int DEFAULT 0,
  p_name text DEFAULT NULL
)
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
    
  INSERT INTO public.tickets (queue_id, token_number, customer_name, customer_phone, status, priority)
    VALUES (p_queue_id, v_token, p_name, p_phone, 'waiting', p_priority) RETURNING id INTO v_ticket_id;
    
  SELECT count(*) INTO v_position FROM public.tickets
    WHERE queue_id = p_queue_id AND status IN ('waiting', 'called') AND id != v_ticket_id;

  SELECT public.estimate_wait(p_queue_id, v_position) INTO v_estimated_wait;

  RETURN jsonb_build_object(
    'ticket_id', v_ticket_id,
    'token_number', v_token,
    'queue_name', v_queue.name,
    'position', v_position,
    'estimated_wait_seconds', v_estimated_wait
  );
END; $$;
