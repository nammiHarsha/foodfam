-- =====================================================
-- MVP ROLE SIMPLIFICATION: Fix RLS policies
-- Fix security issue: prevent self-assigning admin role
-- Fix visibility: make experiences/events publicly viewable
-- =====================================================

-- 1. Fix user_roles INSERT policy - only allow host/guest, prevent admin self-assignment
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Allow users to insert only host or guest roles for themselves
CREATE POLICY "Users can insert their own non-admin roles" 
  ON public.user_roles FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('host'::app_role, 'guest'::app_role)
  );

-- Only existing admins can assign admin role (for future admin management)
CREATE POLICY "Only admins can assign admin role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    role = 'admin'::app_role 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. Fix experiences SELECT policy - ensure active experiences are viewable by everyone
DROP POLICY IF EXISTS "Active experiences are viewable by everyone" ON public.experiences;

CREATE POLICY "Active experiences are viewable by everyone" 
  ON public.experiences FOR SELECT 
  USING (is_active = true);

-- 3. Fix events SELECT policy - make events viewable by everyone
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (true);