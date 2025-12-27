-- Fix: The previous migration still has recursion issues due to overlapping policies
-- We need to use a security definer function to check participation

-- Drop the policies we just created (they still cause recursion)
DROP POLICY IF EXISTS "Users can view their own participations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- Create a security definer function to check if a user is a participant in a conversation
-- This bypasses RLS and avoids recursion
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Create a security definer function to get user's conversation IDs
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id
  FROM public.conversation_participants
  WHERE user_id = _user_id
$$;

-- Now create the RLS policies using these functions

-- SELECT: Users can view participants in conversations they belong to
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- INSERT: Users can only add themselves as participants
CREATE POLICY "Users can add themselves to conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);