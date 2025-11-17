import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="flex justify-center">
        <div className="bg-primary/10 p-4 rounded-full">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Welcome to Little-Leaf!</h2>
        <p className="text-muted-foreground">
          Let's get you set up in 60 seconds
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        We'll tailor your reviews based on your learning goals and preferences
      </p>

      <Button onClick={onNext} className="w-full" size="lg">
        Get Started
      </Button>
    </div>
  );
}
