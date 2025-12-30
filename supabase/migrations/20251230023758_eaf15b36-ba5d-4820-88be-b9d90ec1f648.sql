-- Add foreign key from community_posts.author_id to profiles.user_id for proper joins
ALTER TABLE public.community_posts
ADD CONSTRAINT community_posts_author_profile_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;