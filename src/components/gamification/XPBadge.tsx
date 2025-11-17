import { Trophy } from "lucide-react";
import { calculateLevel, getXPForNextLevel } from "@/lib/xpSystem";

interface XPBadgeProps {
  xp: number;
}

export function XPBadge({ xp }: XPBadgeProps) {
  const level = calculateLevel(xp);
  const nextLevelXP = getXPForNextLevel(xp);
  const xpInCurrentLevel = xp - ((level - 1) * 100);
  const xpNeeded = nextLevelXP - xp;

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
      <div className="p-3 bg-primary/10 rounded-lg">
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Level</span>
          <span className="text-2xl font-bold">{level}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {xp} XP • {xpNeeded} to next level
        </p>
      </div>
    </div>
  );
}
