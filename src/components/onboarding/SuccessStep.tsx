import { Button } from "@/components/ui/button";
import { CheckCircle2, Flame } from "lucide-react";

interface SuccessStepProps {
  onComplete: () => void;
}

export function SuccessStep({ onComplete }: SuccessStepProps) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="flex justify-center">
        <div className="bg-success/10 p-4 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">You're all set!</h2>
        <p className="text-muted-foreground">
          Your personalized learning experience is ready
        </p>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-5 w-5 text-accent" />
          <p className="font-semibold">Your streak starts today!</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete a review session to keep it alive
        </p>
      </div>

      <Button onClick={onComplete} className="w-full" size="lg">
        Start Learning
      </Button>
    </div>
  );
}
