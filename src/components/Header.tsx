import { Link } from "react-router-dom";
import { LogOut, Settings, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
export function Header() {
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAdmin
  } = useRole();
  return <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-primary-foreground">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">Little-Leaf</span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/vocabulary" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Vocabulary
            </Link>
            <Link to="/progress" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Progress
            </Link>
            {isAdmin && <Link to="/users" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Users className="h-4 w-4" />
                Users
              </Link>}
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin && <Badge variant="secondary">Admin</Badge>}
            
            {user && <Button variant="ghost" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>}
          </div>
        </div>
      </div>
    </header>;
}