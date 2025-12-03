import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Calendar, Lightbulb, GraduationCap, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { MobileNav } from "@/components/MobileNav";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { DailyGoalRing } from "@/components/gamification/DailyGoalRing";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { XPBadge } from "@/components/gamification/XPBadge";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    dueToday: 0,
    new: 0,
    mastered: 0,
    totalPoints: 0,
    cardsReviewed: 0,
    dailyGoal: 20,
  });
  const [gamificationStats, setGamificationStats] = useState({
    xp: 0,
    streak: 0,
    streakFreezes: 0,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchGamificationStats();
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking onboarding:", error);
      }

      // Show onboarding if no preferences exist or onboarding not completed
      setShowOnboarding(!data || !data.onboarding_completed);
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

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

      // Count new cards reviewed today (first-time reviews)
      const { data: reviewedToday } = await supabase
        .from('daily_reviews')
        .select('deck_id')
        .eq('user_id', user.id)
        .eq('review_date', today);

      let newCount = 0;
      if (reviewedToday) {
        for (const { deck_id } of reviewedToday) {
          const { count: totalReviews } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('deck_id', deck_id);
          
          // If only 1 review exists for this deck, today was the first time
          if (totalReviews === 1) {
            newCount++;
          }
        }
      }

      // Count cards mastered today (rating 3 = +1 point)
      const { count: masteredCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('points_earned', 1)
        .gte('reviewed_at', `${today}T00:00:00.000Z`)
        .lte('reviewed_at', `${today}T23:59:59.999Z`);

      setStats({
        dueToday,
        new: newCount || 0,
        mastered: masteredCount,
        totalPoints,
        cardsReviewed,
        dailyGoal,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchGamificationStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('xp, streak, streak_freezes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGamificationStats({
        xp: data?.xp || 0,
        streak: data?.streak || 0,
        streakFreezes: data?.streak_freezes || 0,
      });
    } catch (error: any) {
      console.error('Error fetching gamification stats:', error);
    }
  };

  const handleStartReview = () => {
    navigate('/review');
  };

  if (loading || checkingOnboarding) {
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
          <h1 className="text-4xl font-bold mb-2">Sain uu, {user?.email?.split('@')[0]}!</h1>
          <p className="text-lg text-success">Ready to study?</p>
        </div>

        {/* Gamification Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StreakDisplay streak={gamificationStats.streak} streakFreezes={gamificationStats.streakFreezes} />
          <XPBadge xp={gamificationStats.xp} />
          <DailyGoalRing completed={stats.cardsReviewed} goal={stats.dailyGoal} />
        </div>

        {/* Stats Cards */}
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
            Start Review →
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full max-w-md h-14 text-lg"
            onClick={() => window.open('https://quest-1-the-argument-pit-64653015374.us-west1.run.app', '_blank')}
          >
            Take Challenge
            <Zap className="ml-2 h-5 w-5" />
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

      <MobileNav />

      {showOnboarding && user && (
        <OnboardingWizard
          open={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          userId={user.id}
        />
      )}
    </div>
  );
}
