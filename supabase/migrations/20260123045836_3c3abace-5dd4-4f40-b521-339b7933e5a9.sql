-- Fix security issues:
-- 1. Add DELETE policy for reviews (reviewers + admins can delete)
-- 2. Update validate_booking to ensure host_id matches experience host

-- 1. Add DELETE policy for reviews table
CREATE POLICY "Reviewers and admins can delete reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = reviewer_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Update validate_booking function to validate host_id matches experience
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  exp_max_guests INTEGER;
  exp_is_active BOOLEAN;
  exp_host_id UUID;
BEGIN
  -- Validate booking_date is not in the past (if provided)
  IF NEW.booking_date IS NOT NULL AND NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Booking date cannot be in the past';
  END IF;

  -- Get experience details including host_id
  SELECT max_guests, is_active, host_id INTO exp_max_guests, exp_is_active, exp_host_id
  FROM experiences WHERE id = NEW.experience_id;
  
  -- Validate host_id matches the actual experience host
  IF NEW.host_id != exp_host_id THEN
    RAISE EXCEPTION 'Invalid host_id: must match the experience host';
  END IF;
  
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
$function$;