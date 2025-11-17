/**
 * Spaced Repetition System (SM-2 Algorithm)
 * Maps our 3-button rating system to SRS intervals
 */

export type Rating = 1 | 2 | 3; // forgot | almost | got_it

export interface CardState {
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  lapses: number;
}

export interface SRSResult {
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  lapses: number;
  nextReview: Date;
}

/**
 * Calculate next review parameters based on SM-2 algorithm
 * @param rating - User's rating (1=forgot, 2=almost, 3=got_it)
 * @param currentState - Current SRS state of the card
 * @returns Updated SRS state with next review date
 */
export function calculateNextReview(
  rating: Rating,
  currentState: CardState
): SRSResult {
  const now = new Date();
  let { interval, easeFactor, repetitions, lapses } = currentState;

  // Map our 3-button system to SM-2 quality (0-5 scale)
  // 1 (forgot) -> quality 0-1: Reset progress
  // 2 (almost) -> quality 2-3: Partial progress
  // 3 (got_it) -> quality 4-5: Full progress
  
  if (rating === 1) {
    // Forgot: Reset to beginning
    repetitions = 0;
    lapses += 1;
    interval = 0.007; // ~10 minutes in days
    // Don't change ease factor on forgot
  } else if (rating === 2) {
    // Almost: Maintain current level but don't advance much
    repetitions = Math.max(0, repetitions); // Keep at current level
    interval = Math.max(1, interval * 1.2); // Small increase
    // Slightly decrease ease factor
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else {
    // Got it: Advance according to SM-2
    repetitions += 1;
    
    if (repetitions === 1) {
      interval = 1; // 1 day
    } else if (repetitions === 2) {
      interval = 6; // 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    
    // Adjust ease factor (SM-2 formula adapted for 3-point scale)
    // For "got it", we use quality 5 in the formula
    const quality = 5;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor
  }

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setTime(nextReview.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimals
    repetitions,
    lapses,
    nextReview,
  };
}
