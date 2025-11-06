-- Add RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only allow system/triggers to insert roles (no direct user inserts)
-- This policy intentionally allows no one - roles are managed by triggers
CREATE POLICY "Roles managed by system only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);