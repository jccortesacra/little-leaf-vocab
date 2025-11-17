-- Add UPDATE policy for user_preferences table
-- This allows users to update their own preferences, including onboarding_completed flag
CREATE POLICY "Users can update own preferences" 
ON public.user_preferences
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);