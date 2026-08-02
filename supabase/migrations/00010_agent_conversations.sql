-- CUELY — PHASE 8: PATIENT ASSISTANT AGENT CONVERSATIONS

CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  tool_calls jsonb, -- For storing tool invocations if needed
  created_at timestamptz DEFAULT now()
);

-- Indexes for quick fetching of chat history by ticket
CREATE INDEX IF NOT EXISTS idx_agent_conversations_ticket_id ON public.agent_conversations(ticket_id);

-- RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- Agents/Admins can view and insert
CREATE POLICY "Enable read for authenticated or anon" ON public.agent_conversations FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated or anon" ON public.agent_conversations FOR INSERT WITH CHECK (true);
