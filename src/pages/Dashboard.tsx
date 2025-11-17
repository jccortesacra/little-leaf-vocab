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
    totalPoints: 0,
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
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch or create today's progress record
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress')
        .select('cards_reviewed, daily_goal, total_points')
        .eq('user_id', user.id)
        .eq('review_date', today)
        .maybeSingle();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      // If no progress record exists, create one
      if (!progressData) {
        await supabase
          .from('daily_progress')
          .insert({
            user_id: user.id,
            review_date: today,
            cards_reviewed: 0,
            daily_goal: 20,
            total_points: 0,
          });
      }

      const cardsReviewed = progressData?.cards_reviewed || 0;
      const dailyGoal = progressData?.daily_goal || 20;
      const totalPoints = progressData?.total_points || 0;
      
      // Calculate due today as remaining cards to reach daily goal
      const dueToday = Math.max(0, dailyGoal - cardsReviewed);

      // Count new cards (cards with no reviews)
      const { count: newCount } = await supabase
        .from('decks')
        .select('*', { count: 'exact', head: true })
        .not('id', 'in', `(
          SELECT DISTINCT deck_id 
          FROM reviews 
          WHERE user_id = '${user.id}'
        )`);

      // Count mastered cards (reviewed 3+ times with good ratings)
      const { data: masteredData } = await supabase
        .from('reviews')
        .select('deck_id')
        .eq('user_id', user.id)
        .gte('rating', 3);

      const cardReviewCounts = masteredData?.reduce((acc: Record<string, number>, review) => {
        acc[review.deck_id] = (acc[review.deck_id] || 0) + 1;
        return acc;
      }, {});

      const masteredCount = Object.values(cardReviewCounts || {}).filter(
        (count) => count >= 3
      ).length;

      setStats({
        dueToday,
        new: newCount || 0,
        mastered: masteredCount,
        totalPoints,
      });
    } catch (error) {
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

          <Button
            variant="link"
            className="text-foreground hover:text-primary"
            onClick={() => navigate('/decks')}
          >
            Browse Vocabulary
          </Button>
        </div>
      </main>
    </div>
  );
}
