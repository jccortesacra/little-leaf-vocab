import { supabase } from "@/integrations/supabase/client";

export type ABVariant = 'emoji' | 'text';

export async function getOrAssignABVariant(userId: string): Promise<ABVariant> {
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('ab_test_variant')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return existing.ab_test_variant as ABVariant;
  }

  // Randomly assign variant (50/50 split)
  const variant: ABVariant = Math.random() < 0.5 ? 'emoji' : 'text';

  await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      ab_test_variant: variant,
    });

  return variant;
}
