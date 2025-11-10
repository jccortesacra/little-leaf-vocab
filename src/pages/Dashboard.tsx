import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Calendar, Lightbulb, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    dueToday: 0,
    new: 0,
    mastered: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const now = new Date().toISOString();
      
      // Get cards that are due for review
      const { data: dueCards, error: dueError } = await supabase
        .from('reviews')
        .select('card_id')
        .eq('user_id', user?.id)
        .lte('next_review', now);
      
      if (dueError) throw dueError;

      // Get all user cards
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', user?.id);
      
      if (cardsError) throw cardsError;

      // Get cards that have been reviewed
      const { data: reviewedCards, error: reviewedError } = await supabase
        .from('reviews')
        .select('card_id')
        .eq('user_id', user?.id);
      
      if (reviewedError) throw reviewedError;

      const reviewedCardIds = new Set(reviewedCards?.map(r => r.card_id) || []);
      const newCardCount = (allCards?.length || 0) - reviewedCardIds.size;

      // Get mastered cards (those with rating 4 in latest review)
      const { data: masteredCards, error: masteredError } = await supabase
        .from('reviews')
        .select('card_id, rating, reviewed_at')
        .eq('user_id', user?.id)
        .eq('rating', 4)
        .order('reviewed_at', { ascending: false });
      
      if (masteredError) throw masteredError;

      // Count unique mastered cards
      const masteredCardIds = new Set(masteredCards?.map(r => r.card_id) || []);

      setStats({
        dueToday: dueCards?.length || 0,
        new: newCardCount,
        mastered: masteredCardIds.size,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const handleStartReview = () => {
    navigate('/review');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-lg text-success">You have words to review. Let's get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Due Today"
            value={stats.dueToday}
            iconColor="text-success"
          />
          <StatCard
            icon={Lightbulb}
            label="New"
            value={stats.new}
            iconColor="text-accent"
          />
          <StatCard
            icon={GraduationCap}
            label="Mastered"
            value={stats.mastered}
            iconColor="text-primary"
          />
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            className="w-full max-w-md h-14 text-lg bg-success hover:bg-success/90"
            onClick={handleStartReview}
          >
            Start Review
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="flex gap-6 text-sm">
            <Button
              variant="link"
              className="text-foreground hover:text-primary"
              onClick={() => navigate('/decks')}
            >
              Add New Words
            </Button>
            <Button
              variant="link"
              className="text-foreground hover:text-primary"
              onClick={() => navigate('/decks')}
            >
              Browse Vocabulary
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
