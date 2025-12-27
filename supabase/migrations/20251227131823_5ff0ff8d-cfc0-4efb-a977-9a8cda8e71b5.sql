-- Fix the broken RLS policy on conversations table
-- The SELECT policy has a bug: it references conversation_participants.id instead of conversations.id

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
);