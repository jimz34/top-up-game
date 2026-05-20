import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Gamepad2,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Receipt,
  Package,
  MessageCircle,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
    setOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-strong">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gradient-primary)] neon-ring">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="neon-text">Neon</span>Top
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            isAdmin ? (
              /* Admin menu */
              <>
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                  </Button>
                </Link>
                <Link to="/admin/products">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Package className="h-4 w-4" /> Products
                  </Button>
                </Link>
                <Link to="/admin/transactions">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Receipt className="h-4 w-4" /> Transactions
                  </Button>
                </Link>
                <Link to="/admin/settings">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-red-400 hover:text-red-300">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              /* User menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-secondary/60 transition-colors"
                >
                  <span className="text-foreground font-medium">
                    {user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-xl border border-border/50 py-1 shadow-lg z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-[var(--neon)]" /> Dashboard
                    </Link>
                    <Link
                      to="/dashboard?tab=transactions"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition-colors"
                    >
                      <Receipt className="h-4 w-4 text-[var(--neon)]" /> Transaction History
                    </Link>
                    <Link
                      to="/games"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition-colors"
                    >
                      <Package className="h-4 w-4 text-[var(--neon)]" /> Products
                    </Link>
                    <a
                      href="https://wa.me/62895392230443?text=Hi%20NeonTop%2C%20I%20need%20help"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary/60 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 text-[var(--neon)]" /> Support
                    </a>
                    <div className="my-1 border-t border-border/50" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-secondary/60 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-md bg-secondary/60 border border-border/50 text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/50 glass-strong px-4 py-4 space-y-2">
          {user ? (
            isAdmin ? (
              <>
                <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <LayoutDashboard className="h-4 w-4 text-[var(--neon)]" /> Admin Dashboard
                </Link>
                <Link to="/admin/products" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <Package className="h-4 w-4 text-[var(--neon)]" /> Products
                </Link>
                <Link to="/admin/transactions" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <Receipt className="h-4 w-4 text-[var(--neon)]" /> Transactions
                </Link>
                <Link to="/admin/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <Settings className="h-4 w-4 text-[var(--neon)]" /> Settings
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm text-red-400">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <LayoutDashboard className="h-4 w-4 text-[var(--neon)]" /> Dashboard
                </Link>
                <Link to="/dashboard?tab=transactions" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <Receipt className="h-4 w-4 text-[var(--neon)]" /> Transaction History
                </Link>
                <Link to="/games" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm">
                  <Package className="h-4 w-4 text-[var(--neon)]" /> Products
                </Link>
                <a
                  href="https://wa.me/62895392230443?text=Hi%20NeonTop%2C%20I%20need%20help"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm"
                >
                  <MessageCircle className="h-4 w-4 text-[var(--neon)]" /> Support
                </a>
                <div className="pt-1 border-t border-border/50">
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/60 text-sm text-red-400">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Sign in</Button>
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-[var(--gradient-primary)] text-primary-foreground">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
