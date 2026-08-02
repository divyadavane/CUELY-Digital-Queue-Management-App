-- Phase 5: SMS Notification System Migration

-- 1. Add sms_enabled and sms_templates to queues table
ALTER TABLE queues 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_templates JSONB DEFAULT '{
  "joined": "Hi {patient_name}! Your token #{token_number} for {clinic_name} is confirmed. Est. wait: {wait_time}m. We will text when close.",
  "almost_there": "Almost your turn! Token #{token_number} is only {position} positions away at {clinic_name}. Please head to the clinic.",
  "called": "TOKEN #{token_number}! Please proceed to Desk/Room 1 now. Your turn has arrived.",
  "no_show": "You missed your turn for Token #{token_number}. Visit the desk within 10 min to get requeued.",
  "served": "Thank you for visiting {clinic_name}! Token #{token_number} is completed. Have a great day!"
}'::jsonb;

-- 2. Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES queues(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- joined, almost_there, called, no_show, served, manual
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, failed
  error_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying logs per ticket or queue
CREATE INDEX IF NOT EXISTS idx_sms_logs_ticket ON sms_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_queue ON sms_logs(queue_id);

-- Enable RLS on sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sms_logs" ON sms_logs
  FOR SELECT USING (true);

CREATE POLICY "System can insert sms_logs" ON sms_logs
  FOR INSERT WITH CHECK (true);
