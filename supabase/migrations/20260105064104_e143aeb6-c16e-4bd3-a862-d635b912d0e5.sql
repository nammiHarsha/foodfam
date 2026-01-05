-- Drop the unconditional auto-assign trigger
DROP TRIGGER IF EXISTS on_auth_user_role_assign ON auth.users;

-- Add RLS policy for users to insert their own role (but NOT admin)
CREATE POLICY "Users can insert their own role except admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('host'::app_role, 'guest'::app_role)
);