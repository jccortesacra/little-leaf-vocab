-- Create user_deck_states table to track SRS state for each user-deck combination
CREATE TABLE public.user_deck_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  interval INTEGER NOT NULL DEFAULT 0, -- interval in days
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50, -- SM-2 ease factor
  repetitions INTEGER NOT NULL DEFAULT 0, -- number of successful repetitions
  lapses INTEGER NOT NULL DEFAULT 0, -- number of times forgot
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, deck_id)
);

-- Enable RLS
ALTER TABLE public.user_deck_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own deck states"
ON public.user_deck_states
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deck states"
ON public.user_deck_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deck states"
ON public.user_deck_states
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_deck_states_updated_at
BEFORE UPDATE ON public.user_deck_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for faster queries
CREATE INDEX idx_user_deck_states_next_review ON public.user_deck_states(user_id, next_review);
CREATE INDEX idx_user_deck_states_user_deck ON public.user_deck_states(user_id, deck_id);