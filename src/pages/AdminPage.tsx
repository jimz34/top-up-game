import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Receipt, Users, Gamepad2, Package, LogOut, Menu, X, Loader as Loader2, Check, Circle as XCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  adminListTransactions,
  adminUpdateTransactionStatus,
  adminListGames,
  adminListProducts,
  adminListUsers,
  checkIsAdmin,
} from "@/lib/topup.functions";
import { formatIDR } from "@/lib/games";

const STATUS_OPTIONS = [
  { value: "waiting_payment", label: "Waiting Payment" },
  { value: "waiting_confirmation", label: "Waiting Confirmation" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const STATUS_STYLES: Record<string, string> = {
  waiting_payment: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  waiting_confirmation: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  processing: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_ICONS: Record<string, any> = {
  waiting_payment: Clock,
  waiting_confirmation: CreditCard,
  processing: Loader2,
  completed: Check,
  failed: XCircle,
};

type Tab = "orders" | "users" | "games" | "products";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("orders");
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

  const { data: txs = [], isLoading: txLoading } = useQuery({
    queryKey: ["admin-tx"],
    queryFn: () => adminListTransactions(),
    enabled: isAdmin && activeTab === "orders",
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
    enabled: isAdmin && activeTab === "users",
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: () => adminListGames(),
    enabled: isAdmin && activeTab === "games",
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminListProducts(),
    enabled: isAdmin && activeTab === "products",
  });

  const handleStatusChange = async (txId: string, newStatus: string) => {
    try {
      await adminUpdateTransactionStatus(txId, newStatus);
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tx"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  if (loading || checking)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  if (!isAdmin) return null;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "orders", label: "Orders", icon: Receipt },
    { id: "users", label: "Users", icon: Users },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "products", label: "Products", icon: Package },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border/50 glass-strong">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-bold flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[var(--neon)]" /> Admin Panel
          </h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 justify-start"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed top-20 left-4 z-50 grid h-10 w-10 place-items-center rounded-md glass"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="menu"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="w-56 h-full glass-strong border-r border-border/50" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border/50">
              <h2 className="font-bold flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[var(--neon)]" /> Admin Panel
              </h2>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeTab === tab.id
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {activeTab === "orders" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>
            {txLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="text-muted-foreground text-left">
                    <tr className="border-b border-border/50">
                      <th className="py-2 pr-3">Order ID</th>
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Game</th>
                      <th className="py-2 pr-3">Package</th>
                      <th className="py-2 pr-3">Game User ID</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(txs as any[]).map((t) => {
                      const StatusIcon = STATUS_ICONS[t.status] ?? Clock;
                      return (
                        <tr key={t.id} className="border-b border-border/30">
                          <td className="py-3 pr-3 font-mono text-xs">{t.order_id}</td>
                          <td className="py-3 pr-3">
                            <div className="text-sm">{(t.profiles as any)?.display_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{t.user_id?.slice(0, 8)}...</div>
                          </td>
                          <td className="py-3 pr-3">{t.games?.name ?? "—"}</td>
                          <td className="py-3 pr-3">{t.products?.name ?? "—"}</td>
                          <td className="py-3 pr-3 font-mono text-xs">{t.user_game_id}</td>
                          <td className="py-3 pr-3 font-medium">{formatIDR(Number(t.amount))}</td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[t.status] ?? ""}`}>
                              <StatusIcon className={`h-3 w-3 ${t.status === "processing" ? "animate-spin" : ""}`} />
                              {t.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground text-xs">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-3">
                            <Select
                              value={t.status}
                              onValueChange={(val) => handleStatusChange(t.id, val)}
                            >
                              <SelectTrigger className="h-8 w-[160px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                    {txs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-muted-foreground">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">User Management</h1>
            {usersLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="text-muted-foreground text-left">
                    <tr className="border-b border-border/50">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Display Name</th>
                      <th className="py-2 pr-4">Role</th>
                      <th className="py-2 pr-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users as any[]).map((u) => (
                      <tr key={u.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 font-mono text-xs">{u.id?.slice(0, 8)}...</td>
                        <td className="py-3 pr-4">{u.display_name ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                            (u.user_roles as any)?.[0]?.role === "admin"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          }`}>
                            {(u.user_roles as any)?.[0]?.role ?? "user"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "games" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Game Management</h1>
            {gamesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="text-muted-foreground text-left">
                    <tr className="border-b border-border/50">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Slug</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Popular</th>
                      <th className="py-2 pr-4">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(games as any[]).map((g) => (
                      <tr key={g.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 font-medium">{g.name}</td>
                        <td className="py-3 pr-4 font-mono text-xs">{g.slug}</td>
                        <td className="py-3 pr-4">{g.category ?? "—"}</td>
                        <td className="py-3 pr-4">{g.is_popular ? "Yes" : "No"}</td>
                        <td className="py-3 pr-4">{g.is_active ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Product Management</h1>
            {productsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="text-muted-foreground text-left">
                    <tr className="border-b border-border/50">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Game</th>
                      <th className="py-2 pr-4">Price</th>
                      <th className="py-2 pr-4">Cost</th>
                      <th className="py-2 pr-4">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(products as any[]).map((p) => (
                      <tr key={p.id} className="border-b border-border/30">
                        <td className="py-3 pr-4 font-medium">{p.name}</td>
                        <td className="py-3 pr-4">{(p.games as any)?.name ?? "—"}</td>
                        <td className="py-3 pr-4">{formatIDR(Number(p.price))}</td>
                        <td className="py-3 pr-4">{formatIDR(Number(p.cost))}</td>
                        <td className="py-3 pr-4">{p.is_active ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
