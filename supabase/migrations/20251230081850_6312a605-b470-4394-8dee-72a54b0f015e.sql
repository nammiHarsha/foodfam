-- =====================================================
-- FIX 1: Booking Input Validation
-- =====================================================

-- Add CHECK constraint for positive guests_count
ALTER TABLE bookings 
  ADD CONSTRAINT guests_count_positive CHECK (guests_count > 0);

-- Add CHECK constraint for message length (max 1000 chars)
ALTER TABLE bookings
  ADD CONSTRAINT message_length CHECK (char_length(message) <= 1000 OR message IS NULL);

-- Create validation trigger for business logic validations
-- (booking_date validation and max_guests/is_active checks)
CREATE OR REPLACE FUNCTION validate_booking()
RETURNS TRIGGER AS $$
DECLARE
  exp_max_guests INTEGER;
  exp_is_active BOOLEAN;
BEGIN
  -- Validate booking_date is not in the past (if provided)
  IF NEW.booking_date IS NOT NULL AND NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Booking date cannot be in the past';
  END IF;

  -- Get experience details
  SELECT max_guests, is_active INTO exp_max_guests, exp_is_active
  FROM experiences WHERE id = NEW.experience_id;
  
  -- Validate guest count doesn't exceed maximum
  IF exp_max_guests IS NOT NULL AND NEW.guests_count > exp_max_guests THEN
    RAISE EXCEPTION 'Guest count exceeds maximum allowed (%)' , exp_max_guests;
  END IF;
  
  -- Validate experience is active
  IF NOT exp_is_active THEN
    RAISE EXCEPTION 'Experience is not available for booking';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_booking_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking();

-- =====================================================
-- FIX 2: Rate Limiting
-- =====================================================

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action_type)
);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to see/update their own rate limits (for the functions to work)
CREATE POLICY "Users can manage their own rate limits"
  ON rate_limits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  _user_id UUID,
  _action_type TEXT,
  _max_actions INTEGER,
  _window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  current_window_start TIMESTAMPTZ;
BEGIN
  -- Get current rate limit record
  SELECT action_count, window_start INTO current_count, current_window_start
  FROM rate_limits
  WHERE user_id = _user_id AND action_type = _action_type;
  
  -- If no record exists or window expired, reset
  IF current_window_start IS NULL OR (now() - current_window_start) > (_window_minutes || ' minutes')::INTERVAL THEN
    INSERT INTO rate_limits (user_id, action_type, action_count, window_start)
    VALUES (_user_id, _action_type, 1, now())
    ON CONFLICT (user_id, action_type) 
    DO UPDATE SET action_count = 1, window_start = now();
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF current_count >= _max_actions THEN
    RETURN false;
  END IF;
  
  -- Increment count
  UPDATE rate_limits SET action_count = action_count + 1
  WHERE user_id = _user_id AND action_type = _action_type;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Rate limit trigger for bookings (10 per hour)
CREATE OR REPLACE FUNCTION enforce_booking_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.guest_id, 'booking_create', 10, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 10 booking requests per hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER booking_rate_limit_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION enforce_booking_rate_limit();

-- Rate limit trigger for posts (5 per hour)
CREATE OR REPLACE FUNCTION enforce_post_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.author_id, 'post_create', 5, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 posts per hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER post_rate_limit_trigger
  BEFORE INSERT ON community_posts
  FOR EACH ROW EXECUTE FUNCTION enforce_post_rate_limit();

-- Rate limit trigger for messages (30 per minute per conversation)
CREATE OR REPLACE FUNCTION enforce_message_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.sender_id, 'message_' || NEW.conversation_id, 30, 1) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Please slow down';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER message_rate_limit_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION enforce_message_rate_limit();

-- Rate limit trigger for reports (5 per hour)
CREATE OR REPLACE FUNCTION enforce_report_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.reporter_id, 'report_create', 5, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 reports per hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER report_rate_limit_trigger
  BEFORE INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION enforce_report_rate_limit();

-- Rate limit trigger for comments (20 per hour)
CREATE OR REPLACE FUNCTION enforce_comment_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_rate_limit(NEW.author_id, 'comment_create', 20, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Maximum 20 comments per hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER comment_rate_limit_trigger
  BEFORE INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION enforce_comment_rate_limit();