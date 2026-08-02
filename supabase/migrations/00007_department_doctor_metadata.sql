-- ============================================================
-- CUELY — PHASE 4: DEPARTMENT & DOCTOR METADATA
-- ============================================================

-- Add new columns to public.queues to support Departments and Doctors
ALTER TABLE public.queues 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS doctor_name text,
ADD COLUMN IF NOT EXISTS counter_number text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'on break', 'offline'));

-- Optionally, backfill existing mock queues
UPDATE public.queues SET 
  department = 'General OPD', 
  doctor_name = 'Dr. Default', 
  counter_number = 'Counter 1', 
  status = 'available'
WHERE department IS NULL;
