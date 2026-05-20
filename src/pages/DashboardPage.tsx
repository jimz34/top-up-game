import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Receipt, Gamepad2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyProfile, listMyTransactions } from "@/lib/topup.functions";
import { formatIDR } from "@/lib/games";
import { useAuth } from "@/hooks/use-auth";

const STATUS_STYLES: Record<string, string> = {
  waiting_payment: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  waiting_confirmation: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  processing: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  waiting_payment: "Waiting Payment",
  waiting_confirmation: "Waiting Confirmation",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login?redirect=/dashboard");
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
    enabled: !!user,
  });

  const { data: txs = [] } = useQuery({
    queryKey: ["my-tx"],
    queryFn: () => listMyTransactions(),
    enabled: !!user,
  });

  if (loading || !user)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10 pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hi, {profile?.displayName ?? user.email?.split("@")[0]}
          </h1>
          <p className="text-muted-foreground">Track your orders and top-up history.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/games">
            <Button className="gap-2 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring">
              <Gamepad2 className="h-4 w-4" /> Top up
            </Button>
          </Link>
          <a
            href="https://wa.me/62895392230443?text=Hi%20JIMZSTORE%2C%20I%20need%20help"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Support
            </Button>
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total Orders" value={String(txs.length)} />
        <StatCard label="Completed" value={String(txs.filter((t: any) => t.status === "completed").length)} />
        <StatCard label="Active" value={String(txs.filter((t: any) => !["completed", "failed"].includes(t.status)).length)} />
      </div>

      <section className="glass-strong rounded-2xl p-6">
        <h2 className="font-bold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-[var(--neon)]" /> Transaction History
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-muted-foreground text-left">
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Game</th>
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4">User ID</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {(txs as any[]).map((t) => (
                <tr key={t.id} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono text-xs">{t.order_id}</td>
                  <td className="py-3 pr-4">{t.games?.name ?? "—"}</td>
                  <td className="py-3 pr-4">{t.products?.name ?? "—"}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{t.user_game_id}</td>
                  <td className="py-3 pr-4 font-medium">{formatIDR(Number(t.amount))}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                        STATUS_STYLES[t.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No orders yet.{" "}
                    <Link to="/games" className="underline">
                      Start a top-up
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-[var(--neon)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
