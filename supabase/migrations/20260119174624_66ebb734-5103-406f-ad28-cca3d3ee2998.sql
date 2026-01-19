-- Fix PUBLIC_USER_DATA: Restrict profiles table to authenticated users only
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy that only allows authenticated users to view profiles
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);