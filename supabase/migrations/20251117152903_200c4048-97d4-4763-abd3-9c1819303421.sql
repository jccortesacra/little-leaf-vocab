-- Add points tracking to daily_progress table
ALTER TABLE daily_progress
ADD COLUMN total_points integer NOT NULL DEFAULT 0;

-- Create user_preferences table for A/B test variant tracking
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ab_test_variant text NOT NULL CHECK (ab_test_variant IN ('emoji', 'text')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add points_earned to reviews table
ALTER TABLE reviews
ADD COLUMN points_earned integer NOT NULL DEFAULT 0;