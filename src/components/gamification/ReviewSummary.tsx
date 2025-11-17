import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/lib/badgeChecker";
import { BadgeGrid } from "./BadgeGrid";
import { Trophy, Flame, BookOpen, Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ReviewSummaryProps {
  open: boolean;
  onClose: () => void;
  xpEarned: number;
  cardsReviewed: number;
  newStreak: number;
  streakIncremented: boolean;
  newBadges: Badge[];
  onKeepGoing: () => void;
}

export function ReviewSummary({
  open,
  onClose,
  xpEarned,
  cardsReviewed,
  newStreak,
  streakIncremented,
  newBadges,
  onKeepGoing,
}: ReviewSummaryProps) {
  const [showConfetti, setShowConfetti] = useState(newBadges.length > 0);

  const handleShare = () => {
    const text = `I just reviewed ${cardsReviewed} cards and earned ${xpEarned} XP! 🎉 ${newStreak}-day streak! 🔥`;
    navigator.clipboard.writeText(text);
    toast.success("Stats copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Session Complete! 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">+{xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
            
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold">{cardsReviewed}</div>
              <div className="text-xs text-muted-foreground">Cards</div>
            </div>
            
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <Flame className="h-8 w-8 text-warning mx-auto mb-2" />
              <div className="text-2xl font-bold">{newStreak}</div>
              <div className="text-xs text-muted-foreground">
                {streakIncremented ? "Day Streak!" : "Days"}
              </div>
            </div>
          </div>

          {/* New Badges */}
          {newBadges.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-center">New Badges Unlocked! 🎊</h3>
              <BadgeGrid badges={newBadges} compact />
            </div>
          )}

          {/* Streak Message */}
          {streakIncremented && (
            <div className="text-center p-3 bg-warning/10 rounded-lg">
              <p className="text-sm font-medium">
                🔥 Your streak increased to {newStreak} days!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              onClick={onKeepGoing}
            >
              Keep Going
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
