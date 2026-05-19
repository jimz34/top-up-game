import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Gamepad2, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
    setOpen(false);
  };

  const nav = [
    { to: "/", label: "Home" },
    { to: "/games", label: "Games" },
    ...(user ? [{ to: "/dashboard", label: "Dashboard" }] : []),
  ] as const;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "px-3 py-2 text-sm text-foreground font-medium"
      : "px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass-strong">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] neon-ring">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="neon-text">Neon</span>Top
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register">
                <Button size="sm" className="bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-md glass"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/50 glass-strong px-4 py-4 space-y-2">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md hover:bg-secondary/60">
              {n.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="w-full gap-2">
                  <LogOut className="h-4 w-4" />Sign out
                </Button>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="col-span-2">
                    <Button variant="secondary" className="w-full gap-2"><Shield className="h-4 w-4" />Admin Panel</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-[var(--gradient-primary)] text-primary-foreground">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
