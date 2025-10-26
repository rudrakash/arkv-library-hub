-- Allow admins to view all reservations
CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to update reservations
CREATE POLICY "Admins can update reservations"
ON public.reservations
FOR UPDATE
USING (is_admin(auth.uid()));