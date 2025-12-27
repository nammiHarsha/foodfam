-- =====================================================
-- FIX: Secure conversation_participants INSERT policy
-- Prevents unauthorized users from joining conversations
-- =====================================================

-- Drop the insecure policy that allows any authenticated user to add participants
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;

-- Create a SECURITY DEFINER function to safely create conversations with participants
-- This bypasses RLS to allow initial conversation creation
CREATE OR REPLACE FUNCTION public.create_conversation_with_participants(
  participant_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_conversation_id UUID;
  participant_id UUID;
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify caller is in participant list
  IF NOT (auth.uid() = ANY(participant_ids)) THEN
    RAISE EXCEPTION 'Caller must be a participant';
  END IF;
  
  -- Verify at least 2 participants
  IF array_length(participant_ids, 1) < 2 THEN
    RAISE EXCEPTION 'Conversation requires at least 2 participants';
  END IF;
  
  -- Create conversation
  INSERT INTO public.conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;
  
  -- Add all participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (new_conversation_id, participant_id);
  END LOOP;
  
  RETURN new_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_conversation_with_participants(UUID[]) TO authenticated;

-- Create restrictive policy: users can only add participants to their own conversations
-- This is a fallback for edge cases (like group chat additions)
CREATE POLICY "Users can add participants to their conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );