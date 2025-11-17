-- Phase 1: Expand user_preferences for onboarding and gamification foundation
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'travel';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS daily_commitment INTEGER DEFAULT 10;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS last_review_date DATE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0;

-- Add topics and metadata to decks for better organization
ALTER TABLE decks ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS part_of_speech TEXT;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS is_beginner BOOLEAN DEFAULT FALSE;

-- Add hard_flag to user_deck_states for flagging difficult cards
ALTER TABLE user_deck_states ADD COLUMN IF NOT EXISTS hard_flag BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on review dates
CREATE INDEX IF NOT EXISTS idx_user_preferences_last_review ON user_preferences(user_id, last_review_date);
CREATE INDEX IF NOT EXISTS idx_decks_topic ON decks(topic);
CREATE INDEX IF NOT EXISTS idx_decks_is_beginner ON decks(is_beginner);