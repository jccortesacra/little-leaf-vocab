import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const goals = [
  { id: "travel", label: "Travel", description: "Learn phrases for trips" },
  { id: "work", label: "Work", description: "Professional communication" },
  { id: "culture", label: "Culture", description: "Understand traditions" },
  { id: "custom", label: "Just exploring", description: "General learning" },
];

export function GoalStep({ value, onChange, onNext, onBack }: GoalStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">What's your goal?</h3>
        <p className="text-sm text-muted-foreground">
          We'll prioritize relevant content
        </p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              value === goal.id && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onChange(goal.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{goal.label}</p>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </div>
              {value === goal.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
