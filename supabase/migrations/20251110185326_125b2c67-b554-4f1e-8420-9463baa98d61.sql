-- Phase 1: Role-Based Access Control
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Phase 2: Transform decks table to represent words
ALTER TABLE public.decks 
  ADD COLUMN IF NOT EXISTS english_word text,
  ADD COLUMN IF NOT EXISTS mongolian_translation text,
  ADD COLUMN IF NOT EXISTS phonetic text,
  ADD COLUMN IF NOT EXISTS audio_url text;

-- Migrate existing data and handle duplicates by appending a counter
WITH numbered_decks AS (
  SELECT 
    id,
    name,
    description,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
  FROM public.decks
  WHERE english_word IS NULL
)
UPDATE public.decks d
SET 
  english_word = CASE 
    WHEN nd.rn = 1 THEN nd.name
    ELSE nd.name || ' (' || nd.rn || ')'
  END,
  mongolian_translation = nd.description
FROM numbered_decks nd
WHERE d.id = nd.id;

-- Make english_word required and unique
ALTER TABLE public.decks 
  ALTER COLUMN english_word SET NOT NULL;

-- Add unique constraint
ALTER TABLE public.decks
  ADD CONSTRAINT unique_english_word UNIQUE (english_word);

-- Update decks RLS policies for admin-only write access
DROP POLICY IF EXISTS "Users can create their own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can update their own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can delete their own decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view their own decks" ON public.decks;

-- All authenticated users can view decks
CREATE POLICY "All users can view decks"
  ON public.decks FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create decks
CREATE POLICY "Only admins can create decks"
  ON public.decks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update decks
CREATE POLICY "Only admins can update decks"
  ON public.decks FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Only admins can delete decks
CREATE POLICY "Only admins can delete decks"
  ON public.decks FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Phase 3: Update reviews table to work with decks
ALTER TABLE public.reviews 
  ADD COLUMN IF NOT EXISTS deck_id uuid REFERENCES public.decks(id) ON DELETE CASCADE;

-- Make card_id nullable for backward compatibility
ALTER TABLE public.reviews ALTER COLUMN card_id DROP NOT NULL;

-- Add constraint to ensure either card_id or deck_id is set
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS check_card_or_deck;

ALTER TABLE public.reviews
  ADD CONSTRAINT check_card_or_deck 
  CHECK (
    (card_id IS NOT NULL AND deck_id IS NULL) OR
    (card_id IS NULL AND deck_id IS NOT NULL)
  );

-- Phase 4: Audio Storage Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('word-audio', 'word-audio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio bucket
DROP POLICY IF EXISTS "Anyone can view audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete audio files" ON storage.objects;

CREATE POLICY "Anyone can view audio files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'word-audio');

CREATE POLICY "Admins can upload audio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'word-audio' AND
    public.is_admin()
  );

CREATE POLICY "Admins can update audio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'word-audio' AND public.is_admin());

CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'word-audio' AND public.is_admin());

-- Helper function to promote a user to admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;