import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Volume2, ArrowRight, RotateCcw } from "lucide-react";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  pronunciation: string | null;
}

export default function Review() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user, deckId]);

  const fetchCards = async () => {
    setLoadingCards(true);
    try {
      let query = supabase
        .from('decks')
        .select('id, english_word as front, mongolian_translation as back, phonetic as pronunciation, audio_url');

      if (deckId) {
        query = query.eq('id', deckId);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info('No words available for review');
        navigate('/vocabulary');
        return;
      }

      setCards(data as any);
    } catch (error: any) {
      console.error('Error fetching words:', error);
      toast.error('Failed to load review');
      navigate('/dashboard');
    } finally {
      setLoadingCards(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!cards[currentIndex]) return;

    try {
      // Calculate next review time based on rating
      const now = new Date();
      const nextReview = new Date(now);
      
      // Simple SRS logic for Sprint 2
      const intervals = {
        1: 10, // Again: 10 minutes
        2: 60, // Hard: 1 hour
        3: 1440, // Good: 1 day
        4: 4320, // Easy: 3 days
      };
      
      nextReview.setMinutes(nextReview.getMinutes() + intervals[rating as keyof typeof intervals]);

      const { error } = await supabase
        .from('reviews')
        .insert({
          deck_id: cards[currentIndex].id,
          user_id: user?.id,
          rating,
          next_review: nextReview.toISOString(),
        });

      if (error) throw error;

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        toast.success('Review session complete!');
        navigate('/dashboard');
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
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-center text-muted-foreground mb-2">
            {currentIndex + 1} of {cards.length} cards reviewed
          </p>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card
          className="mb-8 cursor-pointer transition-all hover:shadow-lg min-h-[400px] flex items-center justify-center"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <CardContent className="py-16 text-center">
            <p className="text-sm text-muted-foreground mb-4">Mongolian</p>
            {!isFlipped ? (
              <>
                <h2 className="text-5xl font-bold mb-4">{currentCard.front}</h2>
                {currentCard.pronunciation && (
                  <p className="text-xl text-muted-foreground mb-6">/{currentCard.pronunciation}/</p>
                )}
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full"
                >
                  <Volume2 className="h-6 w-6" />
                </Button>
                <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Click card to flip</span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-3xl font-semibold text-primary mb-4">{currentCard.back}</h3>
                <div className="h-px bg-border my-6"></div>
                <p className="text-muted-foreground text-sm">Front: {currentCard.front}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isFlipped && (
          <div className="space-y-4">
            <p className="text-center font-medium mb-4">How well did you know this?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-16"
                onClick={() => handleRating(1)}
              >
                <div className="text-center">
                  <div className="font-semibold">Again</div>
                  <div className="text-xs text-muted-foreground">&lt;10m</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16"
                onClick={() => handleRating(2)}
              >
                <div className="text-center">
                  <div className="font-semibold">Hard</div>
                  <div className="text-xs text-muted-foreground">1h</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 border-primary"
                onClick={() => handleRating(3)}
              >
                <div className="text-center">
                  <div className="font-semibold text-primary">Good</div>
                  <div className="text-xs text-muted-foreground">1d</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16"
                onClick={() => handleRating(4)}
              >
                <div className="text-center">
                  <div className="font-semibold">Easy</div>
                  <div className="text-xs text-muted-foreground">3d</div>
                </div>
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => handleRating(3)}
            >
              Next Card
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
