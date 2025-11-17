import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { getOrAssignABVariant, ABVariant } from "@/lib/abTest";
import { MobileNav } from "@/components/MobileNav";
import { getXPForRating } from "@/lib/xpSystem";
import { updateStreak } from "@/lib/streakSystem";
import { checkAndAwardBadges, Badge } from "@/lib/badgeChecker";
import { ReviewSummary } from "@/components/gamification/ReviewSummary";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  pronunciation: string | null;
  audio_url: string | null;
}

export default function Review() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [dailyProgress, setDailyProgress] = useState({ completed: 0, goal: 20 });
  const [abVariant, setAbVariant] = useState<ABVariant>('emoji');
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionCards, setSessionCards] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    xpEarned: number;
    cardsReviewed: number;
    newStreak: number;
    streakIncremented: boolean;
    newBadges: Badge[];
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCards();
      getOrAssignABVariant(user.id).then(setAbVariant);
    }
  }, [user, deckId]);

  const fetchCards = async () => {
    setLoadingCards(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get cards already reviewed today
      const { data: reviewedToday, error: reviewedTodayError } = await supabase
        .from('daily_reviews')
        .select('deck_id')
        .eq('user_id', user?.id)
        .eq('review_date', today);

      if (reviewedTodayError) throw reviewedTodayError;

      const reviewedIds = reviewedToday?.map(r => r.deck_id) || [];

      // Get today's progress
      const { data: progress, error: progressError } = await supabase
        .from('daily_progress')
        .select('cards_reviewed, daily_goal')
        .eq('user_id', user?.id)
        .eq('review_date', today)
        .maybeSingle();

      if (progressError) throw progressError;

      const cardsReviewed = progress?.cards_reviewed || 0;
      const dailyGoal = progress?.daily_goal || 20;
      const remaining = dailyGoal - cardsReviewed;

      setDailyProgress({ completed: cardsReviewed, goal: dailyGoal });

      if (remaining <= 0) {
        toast.success('Daily goal complete! Come back tomorrow.');
        navigate('/dashboard');
        return;
      }

      // Fetch cards not reviewed today, ordered by difficulty
      let queryBuilder = supabase
        .from('decks')
        .select('id, mongolian_translation, english_word, phonetic, audio_url, difficulty')
        .order('difficulty', { ascending: true })
        .limit(remaining);

      // Exclude cards reviewed today
      if (reviewedIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${reviewedIds.join(',')})`);
      }

      if (deckId) {
        queryBuilder = queryBuilder.eq('id', deckId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info('No more words available for review today');
        navigate('/dashboard');
        return;
      }

      // Transform data to match FlashCard interface
      const transformedCards = data.map(card => ({
        id: card.id,
        front: card.english_word,
        back: card.mongolian_translation,
        pronunciation: card.phonetic,
        audio_url: card.audio_url
      }));

      setCards(transformedCards);
    } catch (error: any) {
      console.error('Error fetching words:', error);
      toast.error('Failed to load review');
      navigate('/dashboard');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleRating = async (rating: number, points: number) => {
    if (!cards[currentIndex]) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const deckId = cards[currentIndex].id;
      
      // Calculate XP for this rating
      const xpEarned = getXPForRating(rating);
      
      // 1. Fetch or create current SRS state for this deck
      const { data: currentState } = await supabase
        .from('user_deck_states')
        .select('interval, ease_factor, repetitions, lapses')
        .eq('user_id', user?.id)
        .eq('deck_id', deckId)
        .maybeSingle();

      // Import SRS algorithm
      const { calculateNextReview } = await import('@/lib/srsAlgorithm');
      
      // Calculate next review using SRS algorithm
      const srsResult = calculateNextReview(rating as 1 | 2 | 3, {
        interval: currentState?.interval || 0,
        easeFactor: currentState?.ease_factor || 2.5,
        repetitions: currentState?.repetitions || 0,
        lapses: currentState?.lapses || 0,
      });

      // 2. Update or create SRS state
      const { error: stateError } = await supabase
        .from('user_deck_states')
        .upsert({
          user_id: user?.id,
          deck_id: deckId,
          interval: srsResult.interval,
          ease_factor: srsResult.easeFactor,
          repetitions: srsResult.repetitions,
          lapses: srsResult.lapses,
          last_reviewed: new Date().toISOString(),
          next_review: srsResult.nextReview.toISOString(),
        }, {
          onConflict: 'user_id,deck_id'
        });

      if (stateError) throw stateError;

      // 3. Save review log with points
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          deck_id: deckId,
          user_id: user?.id,
          rating,
          points_earned: xpEarned,
          next_review: srsResult.nextReview.toISOString(),
        });

      if (reviewError) throw reviewError;

      // 4. Mark card as reviewed today
      const { error: dailyReviewError } = await supabase
        .from('daily_reviews')
        .insert({
          user_id: user?.id,
          deck_id: deckId,
          review_date: today,
        });

      if (dailyReviewError && dailyReviewError.code !== '23505') {
        throw dailyReviewError;
      }

      // 5. Update daily progress with XP
      const { data: currentProgress } = await supabase
        .from('daily_progress')
        .select('cards_reviewed, total_points')
        .eq('user_id', user?.id)
        .eq('review_date', today)
        .maybeSingle();

      const newCount = (currentProgress?.cards_reviewed || 0) + 1;
      const newXP = (currentProgress?.total_points || 0) + xpEarned;

      const { error: progressError } = await supabase
        .from('daily_progress')
        .upsert({
          user_id: user?.id,
          review_date: today,
          cards_reviewed: newCount,
          total_points: newXP,
          daily_goal: 20,
        }, {
          onConflict: 'user_id,review_date'
        });

      if (progressError) throw progressError;

      // 6. Update user XP in preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('xp')
        .eq('user_id', user?.id)
        .maybeSingle();

      const totalXP = (prefs?.xp || 0) + xpEarned;
      
      await supabase
        .from('user_preferences')
        .update({ xp: totalXP })
        .eq('user_id', user?.id);

      // Update session tracking
      setSessionXP(prev => prev + xpEarned);
      setSessionCards(prev => prev + 1);
      setDailyProgress(prev => ({ ...prev, completed: newCount }));

      // Show feedback based on rating
      if (rating === 3) {
        toast.success(`+${xpEarned} XP. Great job!`);
      } else if (rating === 2) {
        toast("Nice! We'll show this again soon.", {
          icon: "⚡",
        });
      } else {
        toast("No worries—scheduled sooner.", {
          icon: "📅",
        });
      }

      // Move to next card or end session
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // End of session - update streak and check badges
        const streakResult = await updateStreak(user?.id || '');
        const newBadges = await checkAndAwardBadges(user?.id || '');
        
        setSummaryData({
          xpEarned: sessionXP + xpEarned,
          cardsReviewed: sessionCards + 1,
          newStreak: streakResult.newStreak,
          streakIncremented: streakResult.streakIncremented,
          newBadges,
        });
        setShowSummary(true);
      }
    } catch (error: any) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    }
  };

  if (loading || loadingCards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-2xl font-bold mb-4">No words to review</h2>
              <p className="text-muted-foreground mb-6">Check back later for vocabulary to practice!</p>
              <Button onClick={() => navigate('/vocabulary')}>Browse Vocabulary</Button>
            </CardContent>
          </Card>
        </main>
        <MobileNav />
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl pb-24 md:pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Review
        </Button>

        <div className="mb-8">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Daily Progress: {dailyProgress.completed}/{dailyProgress.goal} cards reviewed
          </p>
          <p className="text-center text-sm text-muted-foreground mb-3">
            {currentIndex + 1} of {cards.length} cards
          </p>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="mb-8 perspective-[1000px]">
          <div
            className={`relative w-full min-h-[450px] transition-transform duration-600 ease-in-out cursor-pointer ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            {/* Front of card */}
            <Card
              className="absolute inset-0 flex items-center justify-center transition-all hover:shadow-lg [backface-visibility:hidden]"
            >
              <CardContent className="py-20 text-center w-full">
                <h2 className="text-7xl font-bold mb-6 px-4">{currentCard.front}</h2>
                {currentCard.pronunciation && (
                  <p className="text-2xl text-muted-foreground/60 mb-8">/{currentCard.pronunciation}/</p>
                )}
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Click to see answer</span>
                </div>
              </CardContent>
            </Card>

            {/* Back of card */}
            <Card
              className="absolute inset-0 flex items-center justify-center transition-all [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              <CardContent className="py-20 text-center w-full">
                <div className="space-y-6">
                  <div className="text-3xl font-semibold mb-4 px-4">{currentCard.front}</div>
                  <div className="h-px bg-border my-8 max-w-md mx-auto"></div>
                  <div className="text-5xl font-bold text-primary mb-4">{currentCard.back}</div>
                  {currentCard.pronunciation && (
                    <p className="text-xl text-muted-foreground/60">/{currentCard.pronunciation}/</p>
                  )}
                  <div className="flex justify-center">
                    <AudioPlayer audioUrl={currentCard.audio_url} word={currentCard.back} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isFlipped && (() => {
          const buttonConfigs = {
            emoji: [
              { rating: 1, label: '❌ Forgot', points: -1, color: 'text-destructive' },
              { rating: 2, label: '🤔 Almost', points: 0, color: 'text-warning' },
              { rating: 3, label: '✅ Got it', points: 1, color: 'text-success' },
            ],
            text: [
              { rating: 1, label: '1) I forgot', points: -1, color: 'text-destructive' },
              { rating: 2, label: '2) I hesitated', points: 0, color: 'text-warning' },
              { rating: 3, label: '3) I knew it', points: 1, color: 'text-success' },
            ],
          };

          const buttons = buttonConfigs[abVariant];

          return (
            <div className="mt-6 space-y-4">
              <p className="text-center font-medium mb-4 text-lg">How did you do?</p>
              <div className="grid grid-cols-3 gap-3">
                {buttons.map((btn) => (
                  <Button
                    key={btn.rating}
                    variant="outline"
                    className={`h-24 flex flex-col items-center justify-center bg-background hover:bg-accent transition-all ${
                      btn.rating === 3 ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => handleRating(btn.rating, btn.points)}
                  >
                    <div className={`font-semibold text-lg ${btn.color}`}>
                      {btn.label}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          );
        })()}
      </main>
      <MobileNav />
      
      {summaryData && (
        <ReviewSummary
          open={showSummary}
          onClose={() => {
            setShowSummary(false);
            navigate('/dashboard');
          }}
          xpEarned={summaryData.xpEarned}
          cardsReviewed={summaryData.cardsReviewed}
          newStreak={summaryData.newStreak}
          streakIncremented={summaryData.streakIncremented}
          newBadges={summaryData.newBadges}
          onKeepGoing={() => {
            setShowSummary(false);
            navigate('/review');
          }}
        />
      )}
    </div>
  );
}
