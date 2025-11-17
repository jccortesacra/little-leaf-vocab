-- Change interval from integer to numeric to support sub-day intervals
ALTER TABLE user_deck_states 
ALTER COLUMN interval TYPE numeric USING interval::numeric;

-- Add comment explaining the column stores days (including fractional days)
COMMENT ON COLUMN user_deck_states.interval IS 'Review interval in days (can be fractional, e.g., 0.007 days = ~10 minutes)';