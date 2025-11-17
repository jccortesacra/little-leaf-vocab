import { Badge } from "@/lib/badgeChecker";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, 
  Flame, 
  Footprints, 
  GraduationCap, 
  Volume2, 
  Crown,
  LucideIcon 
} from "lucide-react";

interface BadgeGridProps {
  badges: Badge[];
  compact?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  footprints: Footprints,
  'graduation-cap': GraduationCap,
  'volume-2': Volume2,
  crown: Crown,
};

export function BadgeGrid({ badges, compact = false }: BadgeGridProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No badges earned yet. Keep learning to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
      {badges.map((badge) => {
        const Icon = iconMap[badge.icon_name] || Trophy;
        
        return (
          <Card key={badge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="mb-3 p-3 bg-primary/10 rounded-full inline-block">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
              {!compact && badge.description && (
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
