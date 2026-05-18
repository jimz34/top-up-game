import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Wallet, Receipt, Copy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMyWallet, listMyTransactions } from "@/lib/topup.functions";
import { formatIDR } from "@/lib/games";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NeonTop" }] }),
  component: DashboardPage,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  paid: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  processing: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  refunded: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fetchWallet = useServerFn(getMyWallet);
  const fetchTx = useServerFn(listMyTransactions);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login", search: { redirect: "/dashboard" } });
  }, [loading, user, router]);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => fetchWallet({}),
    enabled: !!user,
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["my-tx"],
    queryFn: () => fetchTx({}),
    enabled: !!user,
  });

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hi, {wallet?.displayName ?? user.email?.split("@")[0]}</h1>
        <p className="text-muted-foreground">Manage your wallet, orders and referrals.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-6 neon-ring md:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--neon)]">
            <Wallet className="h-4 w-4" /> Wallet balance
          </div>
          <p className="mt-2 text-4xl font-bold neon-text">{formatIDR(wallet?.balance ?? 0)}</p>
          <div className="mt-4 flex gap-2">
            <Button disabled className="bg-[var(--gradient-primary)] text-primary-foreground">Deposit (coming soon)</Button>
            <Link to="/games"><Button variant="outline">Top up a game</Button></Link>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--neon)]">
            <Gift className="h-4 w-4" /> Referral
          </div>
          <p className="text-sm text-muted-foreground mt-2">Share your code and earn cashback.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-secondary/60 px-3 py-2 font-mono">{wallet?.referralCode ?? "—"}</code>
            <Button size="icon" variant="outline" onClick={() => {
              if (wallet?.referralCode) {
                navigator.clipboard.writeText(wallet.referralCode);
                toast.success("Referral code copied");
              }
            }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <section className="glass-strong rounded-2xl p-6">
        <h2 className="font-bold flex items-center gap-2"><Receipt className="h-4 w-4 text-[var(--neon)]" /> Transaction history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-muted-foreground text-left">
              <tr className="border-b border-border/50">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Game</th>
                <th className="py-2 pr-4">Package</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t: any) => (
                <tr key={t.id} className="border-b border-border/30">
                  <td className="py-3 pr-4 font-mono text-xs">{t.order_id}</td>
                  <td className="py-3 pr-4">{t.games?.name ?? "—"}</td>
                  <td className="py-3 pr-4">{t.products?.name ?? "—"}</td>
                  <td className="py-3 pr-4 font-medium">{formatIDR(Number(t.amount))}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[t.status] ?? ""}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">No orders yet. <Link to="/games" className="underline">Start a top-up →</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
