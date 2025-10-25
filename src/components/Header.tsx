import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, LayoutDashboard, BookMarked, Table2, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <BookOpen className="h-6 w-6" />
          <span>ARKV</span>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Home
              </Button>
            </Link>
            
            {!isAdmin && (
              <>
                <Link to="/books">
                  <Button
                    variant={isActive("/books") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <BookMarked className="h-4 w-4" />
                    Books
                  </Button>
                </Link>
                <Link to="/tables">
                  <Button
                    variant={isActive("/tables") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Table2 className="h-4 w-4" />
                    Tables
                  </Button>
                </Link>
                <Link to="/reservations">
                  <Button
                    variant={isActive("/reservations") ? "default" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    My Reservations
                  </Button>
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <Button onClick={signOut} variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
