-- Add difficulty column to decks table for incremental learning
ALTER TABLE public.decks 
ADD COLUMN difficulty integer DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5);

-- Add index for filtering by difficulty
CREATE INDEX idx_decks_difficulty ON public.decks(difficulty);

-- Add comment explaining difficulty levels
COMMENT ON COLUMN public.decks.difficulty IS 'Difficulty level from 1 (easiest) to 5 (hardest) for incremental learning';