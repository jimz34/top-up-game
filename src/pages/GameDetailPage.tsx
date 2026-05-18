import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getGameWithProducts } from "@/lib/topup.functions";
import { gameImage, formatIDR } from "@/lib/games";
import { useAuth } from "@/hooks/use-auth";

const PAYMENT_METHODS = [
  { id: "wallet", label: "Wallet Balance" },
  { id: "qris", label: "QRIS" },
  { id: "gopay", label: "GoPay" },
  { id: "ovo", label: "OVO" },
  { id: "bank_transfer", label: "Bank Transfer" },
] as const;

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
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["id"]>("qris");
  const [submitting, setSubmitting] = useState(false);

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
          ← Back to all games
        </Link>
      </div>
    );

  const { game, products } = data;
  const selected = products.find((p) => p.id === productId);

  const handleSubmit = async () => {
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
        paymentMethod,
      });
      toast.success(`Order ${res.orderId} created — ${res.status}`);
      navigate("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/games" className="text-sm text-muted-foreground hover:text-foreground">
        ← All games
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

          <Step n={3} title="Payment Method">
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => {
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`text-left rounded-xl p-4 glass ${
                      active ? "ring-2 ring-[var(--neon)] neon-ring" : "hover-glow"
                    }`}
                  >
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.id === "wallet"
                        ? "Pay instantly from your wallet"
                        : "Secure payment via Midtrans"}
                    </p>
                  </button>
                );
              })}
            </div>
          </Step>
        </div>

        <aside className="glass-strong rounded-2xl p-6 h-fit sticky top-20">
          <h3 className="font-bold text-lg">Order Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Game" value={game.name} />
            <Row label={game.user_id_label} value={userGameId || "—"} />
            {game.requires_server_id && <Row label="Server" value={serverId || "—"} />}
            <Row label="Package" value={selected?.name ?? "—"} />
            <Row
              label="Payment"
              value={PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? ""}
            />
          </dl>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-2xl font-bold neon-text">
              {selected ? formatIDR(Number(selected.price)) : "—"}
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-5 w-full h-11 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay now"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            By continuing you agree to our terms and order processing policy.
          </p>
        </aside>
      </div>
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
