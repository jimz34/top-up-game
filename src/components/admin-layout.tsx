import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  LogOut,
  Menu,
  X,
  Settings,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { checkIsAdmin } from "@/lib/topup.functions";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt, end: false },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
  { to: "/admin/settings", label: "Settings", icon: Settings, end: false },
];

export function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login?redirect=/admin");
      return;
    }
    if (!loading && user) {
      checkIsAdmin().then((admin) => {
        setIsAdmin(admin);
        setChecking(false);
        if (!admin) navigate("/dashboard");
      });
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--neon)] border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-secondary text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
    }`;

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gradient-primary)] neon-ring">
            <Gamepad2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">
            <span className="neon-text">Neon</span>Top Admin
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClass}
              onClick={onNavClick}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border/50">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors mb-1"
          onClick={onNavClick}
        >
          <Gamepad2 className="h-4 w-4 shrink-0" /> View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/50 glass-strong shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed bottom-6 left-4 z-50 grid h-12 w-12 place-items-center rounded-full glass-strong shadow-lg neon-ring"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 glass-strong border-r border-border/50">
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
