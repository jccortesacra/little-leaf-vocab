import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserStats {
  xp: number;
  streak: number;
  cardsReviewed: number;
  cardsMastered: number;
  audioPlays: number;
}

export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  // Fetch all badges
  const { data: allBadges, error: badgesError } = await supabase
    .from('badges')
    .select('*');

  if (badgesError) throw badgesError;
  if (!allBadges) return [];

  // Fetch user's current badges
  const { data: userBadges, error: userBadgesError } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (userBadgesError) throw userBadgesError;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

  // Get user stats
  const stats = await getUserStats(userId);

  // Check which badges should be awarded
  const newBadges: Badge[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.requirement_type) {
      case 'xp':
        shouldAward = stats.xp >= badge.requirement_value;
        break;
      case 'streak':
        shouldAward = stats.streak >= badge.requirement_value;
        break;
      case 'cards_reviewed':
        shouldAward = stats.cardsReviewed >= badge.requirement_value;
        break;
      case 'cards_mastered':
        shouldAward = stats.cardsMastered >= badge.requirement_value;
        break;
      case 'audio_plays':
        shouldAward = stats.audioPlays >= badge.requirement_value;
        break;
    }

    if (shouldAward) {
      // Award the badge
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
        });

      if (!insertError) {
        newBadges.push(badge);
      }
    }
  }

  return newBadges;
}

async function getUserStats(userId: string): Promise<UserStats> {
  // Get XP and streak
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('xp, streak')
    .eq('user_id', userId)
    .maybeSingle();

  const xp = preferences?.xp || 0;
  const streak = preferences?.streak || 0;

  // Get total cards reviewed
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId);

  const cardsReviewed = reviews?.length || 0;

  // Get mastered cards (rating 4 or highest rating for each card)
  const { data: masteredCards } = await supabase
    .from('reviews')
    .select('deck_id, rating')
    .eq('user_id', userId)
    .order('reviewed_at', { ascending: false });

  const masteredSet = new Set();
  masteredCards?.forEach(review => {
    if (review.rating === 3 && !masteredSet.has(review.deck_id)) {
      masteredSet.add(review.deck_id);
    }
  });

  const cardsMastered = masteredSet.size;

  // Audio plays - would need to track this separately
  // For now, estimate based on reviews
  const audioPlays = cardsReviewed;

  return {
    xp,
    streak,
    cardsReviewed,
    cardsMastered,
    audioPlays,
  };
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      badge_id,
      badges (
        id,
        name,
        description,
        icon_name,
        requirement_type,
        requirement_value
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return data?.map(ub => ub.badges as unknown as Badge) || [];
}
