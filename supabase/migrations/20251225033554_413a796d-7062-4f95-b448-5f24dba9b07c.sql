-- Add UPDATE policy for conversations table (participants can update their conversations)
CREATE POLICY "Participants can update their conversations"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

-- Drop existing SELECT policy on reports that only shows user's own reports
DROP POLICY IF EXISTS "Users can view their reports" ON public.reports;

-- Add admin SELECT policy for reports - admins can view all reports, users can view their own
CREATE POLICY "Admins and reporters can view reports"
  ON public.reports FOR SELECT
  USING (
    auth.uid() = reporter_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Add admin UPDATE policy for reports - admins can update report status
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add admin SELECT policy for bookings - admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));