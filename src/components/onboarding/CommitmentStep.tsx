import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommitmentStepProps {
  value: number;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const commitments = [
  { minutes: 5, label: "5 min/day", description: "Quick review" },
  { minutes: 10, label: "10 min/day", description: "Recommended" },
  { minutes: 15, label: "15 min/day", description: "Steady progress" },
  { minutes: 20, label: "20+ min/day", description: "Fast learner" },
];

export function CommitmentStep({ value, onChange, onNext, onBack }: CommitmentStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Daily commitment</h3>
        <p className="text-sm text-muted-foreground">
          How much time can you dedicate each day?
        </p>
      </div>

      <div className="space-y-3">
        {commitments.map((commitment) => (
          <Card
            key={commitment.minutes}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              value === commitment.minutes && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onChange(commitment.minutes)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{commitment.label}</p>
                  <p className="text-sm text-muted-foreground">{commitment.description}</p>
                </div>
              </div>
              {value === commitment.minutes && (
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
