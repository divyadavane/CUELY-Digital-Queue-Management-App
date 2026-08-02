-- CUELY — PHASE 7: AGENT TOOL LAYER

-- 1. Create Agent Tables
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text NOT NULL, -- 'patient_assistant' | 'staff_copilot' | 'ops_monitor'
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  tool_input jsonb,
  tool_result jsonb,
  confirmed_by_human boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user' | 'agent' | 'tool'
  content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  suggestion_type text, -- 'rebalance' | 'stalled_counter' | 'anomaly'
  detail jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- RLS for Agent Tables (Admins can view their own, System can insert)
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view agent_actions" ON public.agent_actions FOR SELECT USING (public.is_admin_of_business(business_id));
CREATE POLICY "Admins view agent_conversations" ON public.agent_conversations FOR SELECT USING (public.is_admin_of_business(business_id));
CREATE POLICY "Admins view agent_suggestions" ON public.agent_suggestions FOR SELECT USING (public.is_admin_of_business(business_id));

-- Note: The Node backend service role will bypass RLS to insert rows.

-- 2. New Tool RPCs

-- A. get_estimated_wait(ticket_id)
CREATE OR REPLACE FUNCTION public.get_estimated_wait(p_ticket_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_queue_id uuid;
  v_status text;
  v_joined_at timestamptz;
  v_position int;
  v_wait_seconds int;
BEGIN
  SELECT queue_id, status, joined_at INTO v_queue_id, v_status, v_joined_at
  FROM public.tickets WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  IF v_status != 'waiting' THEN
    RETURN json_build_object('success', true, 'estimated_wait_seconds', 0, 'position', 0);
  END IF;

  -- Calculate position
  SELECT count(*) INTO v_position
  FROM public.tickets
  WHERE queue_id = v_queue_id AND status = 'waiting' AND joined_at < v_joined_at;

  v_wait_seconds := public.estimate_wait(v_queue_id, v_position);
  
  RETURN json_build_object('success', true, 'estimated_wait_seconds', v_wait_seconds, 'position', v_position);
END;
$$;

-- B. switch_queue(ticket_id, new_queue_id)
CREATE OR REPLACE FUNCTION public.switch_queue(p_ticket_id uuid, p_new_queue_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_old_queue_id uuid;
  v_status text;
  v_customer_name text;
  v_customer_phone text;
  v_joined_at timestamptz;
  v_priority int;
  v_emergency_type text;
  v_token_number int;
  v_new_ticket_id uuid;
BEGIN
  -- 1. Get current ticket details and lock the row
  SELECT queue_id, status, customer_name, customer_phone, joined_at, priority, emergency_type
  INTO v_old_queue_id, v_status, v_customer_name, v_customer_phone, v_joined_at, v_priority, v_emergency_type
  FROM public.tickets 
  WHERE id = p_ticket_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  IF v_status != 'waiting' THEN
    RETURN json_build_object('success', false, 'error', 'Only waiting tickets can be switched');
  END IF;

  -- 2. Mark old ticket as left
  UPDATE public.tickets SET status = 'left' WHERE id = p_ticket_id;

  -- 3. Get next token number for new queue
  UPDATE public.queues 
  SET current_token_number = current_token_number + 1
  WHERE id = p_new_queue_id
  RETURNING current_token_number INTO v_token_number;

  -- 4. Insert new ticket into new queue, preserving joined_at
  INSERT INTO public.tickets (
    queue_id, token_number, customer_name, customer_phone, 
    status, priority, emergency_type, joined_at
  ) VALUES (
    p_new_queue_id, v_token_number, v_customer_name, v_customer_phone, 
    'waiting', v_priority, v_emergency_type, v_joined_at
  ) RETURNING id INTO v_new_ticket_id;

  RETURN json_build_object('success', true, 'new_ticket_id', v_new_ticket_id, 'token_number', v_token_number);
END;
$$;

-- C. get_daily_stats(business_id)
CREATE OR REPLACE FUNCTION public.get_daily_stats(p_business_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_total_served int := 0;
  v_total_no_show int := 0;
  v_total_wait_seconds int := 0;
  v_avg_wait_seconds int := 0;
  v_no_show_rate int := 0;
BEGIN
  -- Aggregate served tickets today
  SELECT count(*), coalesce(sum(extract(epoch from (served_at - joined_at))), 0)
  INTO v_total_served, v_total_wait_seconds
  FROM public.tickets t
  JOIN public.queues q ON t.queue_id = q.id
  WHERE q.business_id = p_business_id 
    AND t.status = 'served'
    AND t.served_at >= current_date;

  -- Aggregate no_show tickets today
  SELECT count(*)
  INTO v_total_no_show
  FROM public.tickets t
  JOIN public.queues q ON t.queue_id = q.id
  WHERE q.business_id = p_business_id 
    AND t.status = 'no_show'
    AND t.joined_at >= current_date;

  IF v_total_served > 0 THEN
    v_avg_wait_seconds := (v_total_wait_seconds / v_total_served)::int;
  END IF;

  IF (v_total_served + v_total_no_show) > 0 THEN
    v_no_show_rate := ((v_total_no_show::numeric / (v_total_served + v_total_no_show)::numeric) * 100)::int;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'total_served', v_total_served,
    'avg_wait_minutes', round(v_avg_wait_seconds / 60.0, 1),
    'no_show_rate_percent', v_no_show_rate
  );
END;
$$;

-- D. suggest_rebalance(business_id)
CREATE OR REPLACE FUNCTION public.suggest_rebalance(p_business_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_queues json;
BEGIN
  -- Just gather the raw stats per queue to let the agent decide
  SELECT coalesce(json_agg(
    json_build_object(
      'queue_id', q.id,
      'department', q.department,
      'doctor_name', q.doctor_name,
      'waiting_count', (SELECT count(*) FROM public.tickets t WHERE t.queue_id = q.id AND t.status = 'waiting'),
      'avg_serve_time_mins', (
         SELECT coalesce(avg(duration_seconds)/60, 5) 
         FROM (SELECT duration_seconds FROM public.serving_stats ss WHERE ss.queue_id = q.id ORDER BY recorded_at DESC LIMIT 10) sub
      )
    )
  ), '[]'::json) INTO v_queues
  FROM public.queues q
  WHERE q.business_id = p_business_id AND q.is_active = true;

  RETURN json_build_object('success', true, 'queues', v_queues);
END;
$$;
