-- CUELY — PHASE 8: ML WAIT-TIME PREDICTOR

-- 1. Create model_training_runs table for tracking model metrics
CREATE TABLE IF NOT EXISTS public.model_training_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trained_at timestamptz DEFAULT now(),
  row_count int,
  mae_seconds numeric,
  mape_percent numeric,
  model_version text
);

-- RLS for model_training_runs
ALTER TABLE public.model_training_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view model_training_runs" ON public.model_training_runs FOR SELECT USING (true);

-- 2. Alter tickets table to track wait estimate method
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS wait_estimate_method text DEFAULT 'rolling_average';
