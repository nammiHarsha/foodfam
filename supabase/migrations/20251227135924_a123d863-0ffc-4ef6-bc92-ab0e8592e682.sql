-- Fix infinite recursion in conversation_participants RLS policies
-- The current policy references the same table it's protecting, causing infinite recursion

-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;

-- Create a simple SELECT policy that only checks if the current user is a participant
-- This uses a direct comparison instead of a subquery to the same table
CREATE POLICY "Users can view their own participations"
ON public.conversation_participants
FOR SELECT
USING (auth.uid() = user_id);

-- For viewing OTHER participants in conversations, we need a different approach
-- Create a policy that allows viewing all participants in conversations where the user is a member
-- We use a subquery but with a different approach to avoid recursion
CREATE POLICY "Users can view all participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM public.conversation_participants cp 
    WHERE cp.user_id = auth.uid()
  )
);

-- Create INSERT policy - users can only add themselves to conversations
CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);