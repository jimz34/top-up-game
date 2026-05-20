import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader as Loader2, TriangleAlert as AlertTriangle, QrCode, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getGameWithProducts } from "@/lib/topup.functions";
import { gameImage, formatIDR } from "@/lib/games";
import { useAuth } from "@/hooks/use-auth";
import { QrisModal } from "@/components/qris-modal";

const WA_CONFIRM_NUMBER = "62895392230445";

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["game", slug],
    queryFn: () => getGameWithProducts(slug!),
    enabled: !!slug,
  });

  const [userGameId, setUserGameId] = useState("");
  const [serverId, setServerId] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [qrisModalOpen, setQrisModalOpen] = useState(false);

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );

  if (!data)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <Link to="/games" className="mt-4 inline-block text-sm text-muted-foreground underline">
          Back to all games
        </Link>
      </div>
    );

  const { game, products } = data;
  const selected = products.find((p) => p.id === productId);

  const handleBuy = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate(`/login?redirect=/games/${slug}`);
      return;
    }
    if (!userGameId.trim()) return toast.error("Enter your User ID");
    if (game.requires_server_id && !serverId.trim()) return toast.error("Enter your Server ID");
    if (!productId) return toast.error("Select a package");
    setSubmitting(true);
    try {
      const res = await createTransaction({
        gameId: game.id,
        productId,
        userGameId: userGameId.trim(),
        serverId: serverId.trim() || null,
        paymentMethod: "qris",
      });
      setOrderId(res.orderId);
      setOrderCreated(true);
      toast.success(`Order ${res.orderId} created`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPayment = () => {
    const msg = encodeURIComponent("Min gw mau confirm pembayaran dong");
    window.open(`https://wa.me/${WA_CONFIRM_NUMBER}?text=${msg}`, "_blank");
  };

  if (orderCreated) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <div className="glass-strong rounded-3xl p-8 neon-ring text-center">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-emerald-500/20">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Order Created</h1>
          <p className="mt-2 text-muted-foreground">
            Your order <span className="font-mono text-foreground">{orderId}</span> is waiting for payment.
          </p>
          <div className="mt-6 space-y-3">
            <Button
              className="w-full h-12 gap-2 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring"
              onClick={() => setQrisModalOpen(true)}
            >
              <QrCode className="h-5 w-5" /> QRIS
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 gap-2"
              onClick={handleConfirmPayment}
            >
              <MessageCircle className="h-5 w-5" /> Confirm Payment
            </Button>
            <p className="text-xs text-muted-foreground">
              Pay via QRIS, then click Confirm Payment to send proof via WhatsApp.
            </p>
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full mt-2">
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
        <QrisModal
          open={qrisModalOpen}
          onClose={() => setQrisModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 pb-24">
      <Link to="/games" className="text-sm text-muted-foreground hover:text-foreground">
        All games
      </Link>

      <div className="mt-4 glass-strong rounded-3xl p-6 md:p-8 grid md:grid-cols-[260px_1fr] gap-6 items-center neon-ring">
        <img
          src={gameImage(game.slug)}
          alt={game.name}
          width={512}
          height={640}
          className="rounded-2xl aspect-[4/5] object-cover w-full md:w-[260px]"
        />
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--neon)]">{game.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{game.name}</h1>
          <p className="text-muted-foreground mt-1">{game.publisher}</p>
          <p className="mt-4 text-sm text-muted-foreground max-w-prose">
            Enter your account details, pick a package, and complete payment to receive your top-up
            instantly.
          </p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Step n={1} title="Enter Account">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{game.user_id_label}</Label>
                <Input
                  value={userGameId}
                  onChange={(e) => setUserGameId(e.target.value)}
                  placeholder="e.g. 123456789"
                />
              </div>
              {game.requires_server_id && (
                <div>
                  <Label>Server ID</Label>
                  <Input
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                    placeholder="e.g. 2034"
                  />
                </div>
              )}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Pastikan User ID yang dimasukkan benar. Kesalahan ID bukan tanggung jawab admin.</span>
            </div>
          </Step>

          <Step n={2} title="Select Package">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((p) => {
                const active = productId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    className={`relative text-left rounded-xl p-4 transition glass ${
                      active ? "ring-2 ring-[var(--neon)] neon-ring" : "hover-glow"
                    }`}
                  >
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 neon-text text-lg font-bold">
                      {formatIDR(Number(p.price))}
                    </p>
                    {active && <Check className="absolute top-3 right-3 h-5 w-5 text-[var(--neon)]" />}
                  </button>
                );
              })}
            </div>
          </Step>

          <Step n={3} title="Payment">
            <div className="rounded-xl p-4 glass">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
                  <QrCode className="h-5 w-5 text-[var(--neon)]" />
                </div>
                <div>
                  <p className="font-semibold">QRIS Payment</p>
                  <p className="text-xs text-muted-foreground">Pay via QRIS, then confirm payment through WhatsApp</p>
                </div>
              </div>
            </div>
          </Step>
        </div>

        <aside className="glass-strong rounded-2xl p-6 h-fit sticky top-20 max-lg:static max-lg:mt-6">
          <h3 className="font-bold text-lg">Order Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Game" value={game.name} />
            <Row label={game.user_id_label} value={userGameId || "—"} />
            {game.requires_server_id && <Row label="Server" value={serverId || "—"} />}
            <Row label="Package" value={selected?.name ?? "—"} />
            <Row label="Payment" value="QRIS" />
          </dl>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-2xl font-bold neon-text">
              {selected ? formatIDR(Number(selected.price)) : "—"}
            </span>
          </div>
          <Button
            onClick={handleBuy}
            disabled={submitting || !productId || !userGameId.trim()}
            className="mt-5 w-full h-11 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy now"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            After purchase, pay via QRIS and confirm payment through WhatsApp.
          </p>
        </aside>
      </div>

      <QrisModal
        open={qrisModalOpen}
        onClose={() => setQrisModalOpen(false)}
      />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="glass-strong rounded-2xl p-6">
      <header className="flex items-center gap-3 mb-4">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gradient-primary)] text-primary-foreground font-bold text-sm">
          {n}
        </span>
        <h2 className="font-bold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium truncate max-w-[60%] text-right">{value}</dd>
    </div>
  );
}
