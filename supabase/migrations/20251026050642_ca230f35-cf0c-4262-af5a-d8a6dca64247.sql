-- Create table for student borrowing/reservation details
CREATE TABLE public.student_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- Users can view their own student details
CREATE POLICY "Users can view own student details"
ON public.student_details
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own student details
CREATE POLICY "Users can insert own student details"
ON public.student_details
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all student details
CREATE POLICY "Admins can view all student details"
ON public.student_details
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for better query performance
CREATE INDEX idx_student_details_reservation_id ON public.student_details(reservation_id);
CREATE INDEX idx_student_details_user_id ON public.student_details(user_id);