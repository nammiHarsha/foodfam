-- Update the post rate limit from 5 to 20 posts per hour
CREATE OR REPLACE FUNCTION public.enforce_post_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.author_id, 'post_create', 20, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 20 posts per hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;