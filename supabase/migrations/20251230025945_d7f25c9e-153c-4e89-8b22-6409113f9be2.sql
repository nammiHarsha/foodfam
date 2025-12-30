-- Add foreign keys from experiences, events, bookings, reviews to profiles.user_id for proper Supabase joins

-- experiences.host_id -> profiles.user_id
ALTER TABLE public.experiences
ADD CONSTRAINT experiences_host_profile_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- events.host_id -> profiles.user_id  
ALTER TABLE public.events
ADD CONSTRAINT events_host_profile_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- bookings.guest_id -> profiles.user_id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_guest_profile_fkey 
FOREIGN KEY (guest_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- bookings.host_id -> profiles.user_id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_host_profile_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- reviews.reviewer_id -> profiles.user_id
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_reviewer_profile_fkey 
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;