import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WelcomeStep } from "./WelcomeStep";
import { LevelStep } from "./LevelStep";
import { GoalStep } from "./GoalStep";
import { CommitmentStep } from "./CommitmentStep";
import { NotificationsStep } from "./NotificationsStep";
import { SuccessStep } from "./SuccessStep";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingData {
  level: string;
  goal: string;
  dailyCommitment: number;
  reminderTime: string | null;
}

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  userId: string;
}

export function OnboardingWizard({ open, onComplete, userId }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    level: "beginner",
    goal: "travel",
    dailyCommitment: 10,
    reminderTime: null,
  });

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Check if preferences exist
      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from("user_preferences")
          .update({
            level: data.level,
            goal: data.goal,
            daily_commitment: data.dailyCommitment,
            reminder_time: data.reminderTime,
            onboarding_completed: true,
          })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase.from("user_preferences").insert({
          user_id: userId,
          level: data.level,
          goal: data.goal,
          daily_commitment: data.dailyCommitment,
          reminder_time: data.reminderTime,
          onboarding_completed: true,
          ab_test_variant: "default",
        });

        if (error) throw error;
      }

      toast.success("Welcome! Your learning journey starts now.");
      onComplete();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast.error("Failed to save preferences. Please try again.");
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const steps = [
    <WelcomeStep key="welcome" onNext={handleNext} />,
    <LevelStep
      key="level"
      value={data.level}
      onChange={(val) => updateData("level", val)}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <GoalStep
      key="goal"
      value={data.goal}
      onChange={(val) => updateData("goal", val)}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <CommitmentStep
      key="commitment"
      value={data.dailyCommitment}
      onChange={(val) => updateData("dailyCommitment", val)}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <NotificationsStep
      key="notifications"
      value={data.reminderTime}
      onChange={(val) => updateData("reminderTime", val)}
      onNext={handleNext}
      onBack={handleBack}
    />,
    <SuccessStep key="success" onComplete={handleComplete} />,
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          {steps[currentStep]}
        </div>
      </DialogContent>
    </Dialog>
  );
}
