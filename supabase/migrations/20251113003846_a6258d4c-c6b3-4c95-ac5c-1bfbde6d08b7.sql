-- Create daily_progress table to track cards reviewed per day per user
CREATE TABLE public.daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  cards_reviewed integer NOT NULL DEFAULT 0,
  daily_goal integer NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, review_date)
);

-- Enable RLS
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_progress
CREATE POLICY "Users can view their own daily progress"
ON public.daily_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily progress"
ON public.daily_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily progress"
ON public.daily_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_daily_progress_user_date ON public.daily_progress(user_id, review_date);

-- Create daily_reviews table to track which cards were reviewed today
CREATE TABLE public.daily_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id uuid NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT CURRENT_DATE,
  reviewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, deck_id, review_date)
);

-- Enable RLS
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_reviews
CREATE POLICY "Users can view their own daily reviews"
ON public.daily_reviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily reviews"
ON public.daily_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_daily_reviews_user_date ON public.daily_reviews(user_id, review_date);
CREATE INDEX idx_daily_reviews_user_deck_date ON public.daily_reviews(user_id, deck_id, review_date);

-- Add trigger for updating daily_progress.updated_at
CREATE TRIGGER update_daily_progress_updated_at
BEFORE UPDATE ON public.daily_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();