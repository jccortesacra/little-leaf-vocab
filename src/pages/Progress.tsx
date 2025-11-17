import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";

export default function ProgressPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    learning: 0,
    mastered: 0,
    nextReview: "No reviews scheduled",
    overallMastery: 0,
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
      // Get all user cards
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', user?.id);
      
      if (cardsError) throw cardsError;

      const totalCards = allCards?.length || 0;

      // Get reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('card_id, rating, next_review')
        .eq('user_id', user?.id)
        .order('reviewed_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;

      // Count mastered cards (rating 4)
      const masteredCardIds = new Set();
      const learningCardIds = new Set();
      let nextReviewDate: Date | null = null;

      reviews?.forEach(review => {
        if (!masteredCardIds.has(review.card_id) && !learningCardIds.has(review.card_id)) {
          if (review.rating === 4) {
            masteredCardIds.add(review.card_id);
          } else {
            learningCardIds.add(review.card_id);
          }
        }

        const reviewDate = new Date(review.next_review);
        if (!nextReviewDate || reviewDate < nextReviewDate) {
          nextReviewDate = reviewDate;
        }
      });

      const masteredCount = masteredCardIds.size;
      const learningCount = totalCards - masteredCount;
      const mastery = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

      let nextReviewText = "No reviews scheduled";
      if (nextReviewDate) {
        const now = new Date();
        const diffMs = nextReviewDate.getTime() - now.getTime();
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) {
          nextReviewText = "Due now";
        } else if (diffHours < 24) {
          nextReviewText = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else {
          const diffDays = Math.round(diffHours / 24);
          nextReviewText = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        }
      }

      setStats({
        learning: learningCount,
        mastered: masteredCount,
        nextReview: nextReviewText,
        overallMastery: mastery,
      });
    } catch (error: any) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl pb-24 md:pb-8">
          <DashboardSkeleton />
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Hello, {user?.email?.split('@')[0]}!</h1>
          <p className="text-lg text-primary">Here is your progress at a glance.</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Overall Mastery</h2>
            <span className="text-3xl font-bold text-primary">{stats.overallMastery}%</span>
          </div>
          <Progress value={stats.overallMastery} className="h-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            label="Learning"
            value={stats.learning}
            description="Words in progress"
            iconColor="text-accent"
          />
          <StatCard
            icon={GraduationCap}
            label="Mastered"
            value={stats.mastered}
            description="Well-known words"
            iconColor="text-primary"
          />
          <StatCard
            icon={Clock}
            label="Next Review"
            value={stats.nextReview}
            description="Keep up the streak!"
            iconColor="text-accent"
          />
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="w-full max-w-md h-14 text-lg bg-primary hover:bg-primary/90"
            onClick={() => navigate('/review')}
          >
            Continue Learning
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
