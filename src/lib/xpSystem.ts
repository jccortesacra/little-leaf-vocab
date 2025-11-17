import { supabase } from "@/integrations/supabase/client";

export const XP_PER_CORRECT = 1;
export const XP_PER_ALMOST = 0;
export const XP_PER_FORGOT = 0;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * 100;
}

export function getXPProgressPercent(currentXP: number): number {
  const levelStart = (calculateLevel(currentXP) - 1) * 100;
  const levelEnd = calculateLevel(currentXP) * 100;
  return ((currentXP - levelStart) / (levelEnd - levelStart)) * 100;
}

export async function awardXP(userId: string, xpAmount: number): Promise<number> {
  const { data: preferences, error: fetchError } = await supabase
    .from('user_preferences')
    .select('xp')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const currentXP = preferences?.xp || 0;
  const newXP = currentXP + xpAmount;

  if (preferences) {
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({ xp: newXP })
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        ab_test_variant: 'emoji',
        xp: newXP,
      });

    if (insertError) throw insertError;
  }

  return newXP;
}

export function getXPForRating(rating: number): number {
  if (rating === 3) return XP_PER_CORRECT;
  if (rating === 2) return XP_PER_ALMOST;
  return XP_PER_FORGOT;
}
