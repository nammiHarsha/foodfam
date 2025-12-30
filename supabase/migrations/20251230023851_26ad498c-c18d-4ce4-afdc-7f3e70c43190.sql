-- Add foreign key from post_comments.author_id to profiles.user_id for proper joins
ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_author_profile_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;