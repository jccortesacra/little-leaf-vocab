import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const levels = [
  { id: "beginner", label: "Beginner", description: "New to Mongolian" },
  { id: "intermediate", label: "Intermediate", description: "Know some basics" },
  { id: "advanced", label: "Advanced", description: "Fairly comfortable" },
];

export function LevelStep({ value, onChange, onNext, onBack }: LevelStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">What's your level?</h3>
        <p className="text-sm text-muted-foreground">
          Help us show you the right content
        </p>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <Card
            key={level.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              value === level.id && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={() => onChange(level.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{level.label}</p>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
              {value === level.id && (
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
