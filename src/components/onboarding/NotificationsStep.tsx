import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

interface NotificationsStepProps {
  value: string | null;
  onChange: (value: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function NotificationsStep({ value, onChange, onNext, onBack }: NotificationsStepProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex justify-center">
        <div className="bg-accent/10 p-3 rounded-full">
          <Bell className="h-8 w-8 text-accent" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-xl font-semibold">Daily reminder?</h3>
        <p className="text-sm text-muted-foreground">
          Get a gentle nudge to keep your streak alive
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Reminder time (optional)</Label>
          <Input
            id="reminder-time"
            type="time"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="19:00"
          />
          <p className="text-xs text-muted-foreground">
            Choose a time when you're usually free to study
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          {value ? "Set Reminder" : "Skip"}
        </Button>
      </div>
    </div>
  );
}
