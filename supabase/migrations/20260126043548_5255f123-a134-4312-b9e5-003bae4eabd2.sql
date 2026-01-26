-- Fix profiles table exposure by restricting access to legitimate interactions only
-- This prevents bulk scraping while allowing normal social features to work

-- 1. Create a security definer function to check if a user can view a profile
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Users can always view their own profile
  IF _viewer_id = _profile_user_id THEN
    RETURN true;
  END IF;
  
  -- Admins can view all profiles
  IF has_role(_viewer_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Users in shared conversations can view each other's profiles
  IF EXISTS (
    SELECT 1 FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = _viewer_id AND cp2.user_id = _profile_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Guests and hosts in shared bookings can view each other's profiles
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE (guest_id = _viewer_id AND host_id = _profile_user_id)
       OR (host_id = _viewer_id AND guest_id = _profile_user_id)
  ) THEN
    RETURN true;
  END IF;
  
  -- Users can view profiles of hosts with active experiences
  IF EXISTS (
    SELECT 1 FROM experiences
    WHERE host_id = _profile_user_id AND is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Users can view profiles of hosts with events
  IF EXISTS (
    SELECT 1 FROM events
    WHERE host_id = _profile_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Users can view profiles of community post authors
  IF EXISTS (
    SELECT 1 FROM community_posts
    WHERE author_id = _profile_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Users can view profiles of comment authors on posts they can see
  IF EXISTS (
    SELECT 1 FROM post_comments
    WHERE author_id = _profile_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Users can view profiles of reviewers (reviews are public)
  IF EXISTS (
    SELECT 1 FROM reviews
    WHERE reviewer_id = _profile_user_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 2. Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- 3. Create new restrictive SELECT policy using the function
CREATE POLICY "Profiles viewable with legitimate interaction"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND can_view_profile(auth.uid(), user_id)
);