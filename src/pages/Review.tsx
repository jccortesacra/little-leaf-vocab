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
      // Fetch cards from database - Mongolian as front, English as back
      const queryBuilder = supabase
        .from('decks')
        .select(`
          id,
          mongolian_translation,
          english_word,
          phonetic,
          audio_url
        `);

      if (deckId) {
        queryBuilder.eq('id', deckId);
      }

      const { data, error } = await queryBuilder.limit(20);
      
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info('No words available for review');
        navigate('/vocabulary');
        return;
      }

      // Transform data to match FlashCard interface
      const transformedCards = data.map(card => ({
        id: card.id,
        front: card.mongolian_translation,
        back: card.english_word,
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
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Review
        </Button>

        <div className="mb-8">
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
                <div className="flex justify-center mb-8">
                  <AudioPlayer audioUrl={currentCard.audio_url} word={currentCard.front} />
                </div>
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
                  <div className="text-5xl font-bold mb-4 px-4">{currentCard.front}</div>
                  {currentCard.pronunciation && (
                    <p className="text-xl text-muted-foreground/60">/{currentCard.pronunciation}/</p>
                  )}
                  <div className="h-px bg-border my-8 max-w-md mx-auto"></div>
                  <div className="text-3xl font-semibold text-primary">{currentCard.back}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isFlipped && (
          <div className="space-y-4">
            <p className="text-center font-medium mb-4 text-lg">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center bg-background hover:bg-accent"
                onClick={() => handleRating(1)}
              >
                <div className="font-semibold text-base">Again</div>
                <div className="text-xs text-muted-foreground mt-1">&lt;10m</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center bg-background hover:bg-accent"
                onClick={() => handleRating(2)}
              >
                <div className="font-semibold text-base">Hard</div>
                <div className="text-xs text-muted-foreground mt-1">1h</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center bg-background hover:bg-accent border-2 border-primary"
                onClick={() => handleRating(3)}
              >
                <div className="font-semibold text-base text-primary">Good</div>
                <div className="text-xs text-muted-foreground mt-1">1d</div>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center bg-background hover:bg-accent"
                onClick={() => handleRating(4)}
              >
                <div className="font-semibold text-base">Easy</div>
                <div className="text-xs text-muted-foreground mt-1">3d</div>
              </Button>
            </div>
            <Button
              className="w-full h-14 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              onClick={() => handleRating(3)}
            >
              Next Card
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
