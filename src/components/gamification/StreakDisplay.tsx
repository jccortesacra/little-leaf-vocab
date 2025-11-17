import { Flame } from "lucide-react";
import { getStreakMessage } from "@/lib/streakSystem";

interface StreakDisplayProps {
  streak: number;
  streakFreezes?: number;
}

export function StreakDisplay({ streak, streakFreezes = 0 }: StreakDisplayProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
      <div className="p-3 bg-warning/10 rounded-lg">
        <Flame className="h-6 w-6 text-warning" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{streak}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {getStreakMessage(streak)}
        </p>
      </div>
      {streakFreezes > 0 && (
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Freezes</div>
          <div className="text-sm font-semibold">{streakFreezes}</div>
        </div>
      )}
    </div>
  );
}
