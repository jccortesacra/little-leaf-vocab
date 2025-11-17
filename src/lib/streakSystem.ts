import { supabase } from "@/integrations/supabase/client";

export interface StreakData {
  streak: number;
  lastReviewDate: string | null;
  streakFreezes: number;
}

export async function updateStreak(userId: string): Promise<{ newStreak: number; streakIncremented: boolean }> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: preferences, error: fetchError } = await supabase
    .from('user_preferences')
    .select('streak, last_review_date, streak_freezes')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const currentStreak = preferences?.streak || 0;
  const lastReviewDate = preferences?.last_review_date;
  const streakFreezes = preferences?.streak_freezes || 0;

  let newStreak = currentStreak;
  let streakIncremented = false;

  if (!lastReviewDate) {
    // First ever review
    newStreak = 1;
    streakIncremented = true;
  } else if (lastReviewDate === today) {
    // Already reviewed today, maintain streak
    newStreak = currentStreak;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastReviewDate === yesterdayStr) {
      // Reviewed yesterday, increment streak
      newStreak = currentStreak + 1;
      streakIncremented = true;
    } else {
      // Missed day(s), reset to 1
      newStreak = 1;
      streakIncremented = false;
    }
  }

  if (preferences) {
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        streak: newStreak,
        last_review_date: today,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        ab_test_variant: 'emoji',
        streak: newStreak,
        last_review_date: today,
      });

    if (insertError) throw insertError;
  }

  return { newStreak, streakIncremented };
}

export async function useStreakFreeze(userId: string): Promise<boolean> {
  const { data: preferences, error: fetchError } = await supabase
    .from('user_preferences')
    .select('streak_freezes')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const freezes = preferences?.streak_freezes || 0;
  
  if (freezes <= 0) {
    return false;
  }

  const { error: updateError } = await supabase
    .from('user_preferences')
    .update({
      streak_freezes: freezes - 1,
    })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return true;
}

export function getStreakMessage(streak: number): string {
  if (streak === 0) return "Start your streak today!";
  if (streak === 1) return "You're on a 1-day streak!";
  if (streak < 7) return `You're on a ${streak}-day streak!`;
  if (streak < 30) return `${streak}-day streak! Keep it up!`;
  return `Amazing ${streak}-day streak! 🔥`;
}
