import { Progress } from "@/components/ui/progress";

interface DailyGoalRingProps {
  completed: number;
  goal: number;
}

export function DailyGoalRing({ completed, goal }: DailyGoalRingProps) {
  const percentage = Math.min((completed / goal) * 100, 100);
  
  let ringColor = "text-muted-foreground";
  let bgColor = "bg-muted";
  
  if (percentage >= 100) {
    ringColor = "text-success";
    bgColor = "bg-success/20";
  } else if (percentage >= 50) {
    ringColor = "text-primary";
    bgColor = "bg-primary/20";
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-xl">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
            className={ringColor}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold">{completed}</div>
          <div className="text-sm text-muted-foreground">of {goal}</div>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="font-semibold mb-1">Daily Goal</h3>
        <p className="text-sm text-muted-foreground">
          {percentage >= 100 
            ? "Goal complete! 🎉" 
            : `${Math.round(percentage)}% complete`}
        </p>
      </div>
    </div>
  );
}
