-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges
CREATE POLICY "Anyone can view badges"
  ON public.badges
  FOR SELECT
  USING (true);

-- Only admins can manage badges
CREATE POLICY "Admins can manage badges"
  ON public.badges
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create user_badges junction table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert badges (via functions/triggers)
CREATE POLICY "System can insert badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (name, description, icon_name, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first review', 'footprints', 'cards_reviewed', 1),
  ('Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 7),
  ('Century Club', 'Earn 100 XP', 'trophy', 'xp', 100),
  ('Word Master', 'Master 50 words', 'graduation-cap', 'cards_mastered', 50),
  ('Audio Champion', 'Listen to audio 50 times', 'volume-2', 'audio_plays', 50),
  ('Month Legend', 'Maintain a 30-day streak', 'crown', 'streak', 30);

-- Create index for performance
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);