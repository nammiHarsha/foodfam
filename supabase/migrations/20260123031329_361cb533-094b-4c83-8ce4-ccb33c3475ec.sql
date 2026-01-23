-- Update DELETE policies to allow admins to moderate content

-- 1. Update community_posts DELETE policy
DROP POLICY IF EXISTS "Authors can delete their posts" ON public.community_posts;
CREATE POLICY "Authors and admins can delete posts"
ON public.community_posts FOR DELETE
USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Update experiences DELETE policy
DROP POLICY IF EXISTS "Hosts can delete their experiences" ON public.experiences;
CREATE POLICY "Hosts and admins can delete experiences"
ON public.experiences FOR DELETE
USING (auth.uid() = host_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Update events DELETE policy
DROP POLICY IF EXISTS "Hosts can delete their events" ON public.events;
CREATE POLICY "Hosts and admins can delete events"
ON public.events FOR DELETE
USING (auth.uid() = host_id OR has_role(auth.uid(), 'admin'::app_role));