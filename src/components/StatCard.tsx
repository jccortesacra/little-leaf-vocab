import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  iconColor?: string;
}

export function StatCard({ icon: Icon, label, value, description, iconColor = "text-primary" }: StatCardProps) {
  return (
    <Card className="border-border bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`rounded-lg bg-primary/10 p-2 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
