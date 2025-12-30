-- Create function to auto-assign 'guest' role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'guest'::app_role);
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to auto-assign role after signup
DROP TRIGGER IF EXISTS on_auth_user_role_assign ON auth.users;
CREATE TRIGGER on_auth_user_role_assign
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_role();

-- Update RLS policies on user_roles: remove frontend INSERT, keep SELECT
DROP POLICY IF EXISTS "Users can insert their own non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign admin role" ON public.user_roles;