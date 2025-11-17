import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, TrendingUp, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Home" },
    { to: "/review", icon: Play, label: "Review" },
    { to: "/decks", icon: BookOpen, label: "Vocabulary" },
    { to: "/progress", icon: TrendingUp, label: "Progress" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors min-w-[44px] min-h-[44px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
