import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader as Loader2, TriangleAlert as AlertTriangle, QrCode, MessageCircle, Minus, Plus, Users, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { createTransaction, getGameWithProducts } from "@/lib/topup.functions";
import { gameImage, formatIDR } from "@/lib/games";
import { useAuth } from "@/hooks/use-auth";
import { QrisModal } from "@/components/qris-modal";

const WA_CONFIRM_NUMBER = "62895392230445";

const PRODUCT_TYPE_META: Record<string, { icon: React.ElementType; label: string; unitLabel: string }> = {
  followers: { icon: Users, label: "Followers", unitLabel: "followers" },
  likes: { icon: ThumbsUp, label: "Likes", unitLabel: "likes" },
};

function QuantitySelector({
  value,
  min,
  onChange,
  unitLabel,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
  unitLabel: string;
}) {
  const decrement = () => {
    const next = Math.max(min, value - min);
    onChange(next);
  };

  const increment = () => {
    onChange(value + min);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value.replace(/\D/g, ""), 10);
    onChange(isNaN(raw) ? min : raw);
  };

  const handleBlur = () => {
    if (value < min) {
      onChange(min);
      return;
    }
    const remainder = value % min;
    if (remainder !== 0) onChange(value - remainder + min);
  };

  const tooLow = value < min;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl glass border border-border/50 text-foreground transition hover:border-[var(--neon)]/50 hover:text-[var(--neon)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <Input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleInput}
            onBlur={handleBlur}
            className="text-center text-lg font-bold h-10 bg-transparent border-[var(--neon)]/30 focus-visible:border-[var(--neon)] focus-visible:ring-[var(--neon)]/20 pr-20"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unitLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={increment}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl glass border border-border/50 text-foreground transition hover:border-[var(--neon)]/50 hover:text-[var(--neon)]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {tooLow && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Minimum {min.toLocaleString()} {unitLabel}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[min, min * 2, min * 5, min * 10].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition border ${
              value === preset
                ? "border-[var(--neon)]/60 bg-[var(--neon)]/10 text-[var(--neon)]"
                : "border-border/40 bg-secondary/40 text-muted-foreground hover:border-[var(--neon)]/30 hover:text-foreground"
            }`}
          >
            {preset.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}

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
  const [userInput, setUserInput] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
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

  const isCustomQty =
    selected?.product_type === "followers" || selected?.product_type === "likes";

  const effectiveQty = isCustomQty ? quantity : 1;
  const totalPrice =
    isCustomQty && selected?.price_per_unit != null
      ? Number(selected.price_per_unit) * effectiveQty
      : selected
      ? Number(selected.price)
      : 0;

  const isSocialMedia = products.some(
    (p) => p.product_type === "followers" || p.product_type === "likes"
  );

  const handleSelectProduct = (pid: string, ptype: string, minQty: number | null) => {
    setProductId(pid);
    if (ptype === "followers" || ptype === "likes") {
      setQuantity(minQty ?? (ptype === "followers" ? 100 : 1000));
    }
  };

  const handleBuy = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate(`/login?redirect=/games/${slug}`);
      return;
    }
    if (!userGameId.trim()) return toast.error("Enter your User ID");
    if (game.requires_server_id && !serverId.trim()) return toast.error("Enter your Server ID");
    if (!productId) return toast.error("Select a package");
    if (isCustomQty && quantity < (selected?.min_quantity ?? 1)) {
      return toast.error(`Minimum quantity is ${selected?.min_quantity?.toLocaleString()}`);
    }

    setSubmitting(true);
    try {
      const res = await createTransaction({
        gameId: game.id,
        productId,
        userGameId: userGameId.trim(),
        serverId: serverId.trim() || null,
        paymentMethod: "qris",
        quantity: effectiveQty,
        userInput: userInput.trim() || null,
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
            <Button variant="outline" className="w-full h-12 gap-2" onClick={handleConfirmPayment}>
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
        <QrisModal open={qrisModalOpen} onClose={() => setQrisModalOpen(false)} />
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
          {/* Step 1 */}
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
            {isSocialMedia && (
              <div className="mt-4">
                <Label>Profile URL / Username</Label>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g. https://instagram.com/yourusername"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Make sure your account is public before ordering.
                </p>
              </div>
            )}
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Pastikan User ID yang dimasukkan benar. Kesalahan ID bukan tanggung jawab admin.</span>
            </div>
          </Step>

          {/* Step 2 */}
          <Step n={2} title="Select Package">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((p) => {
                const active = productId === p.id;
                const meta = PRODUCT_TYPE_META[p.product_type ?? "fixed"];
                const Icon = meta?.icon;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      handleSelectProduct(p.id, p.product_type ?? "fixed", p.min_quantity ?? null)
                    }
                    className={`relative text-left rounded-xl p-4 transition glass ${
                      active ? "ring-2 ring-[var(--neon)] neon-ring" : "hover-glow"
                    }`}
                  >
                    {Icon && (
                      <span className="inline-flex items-center gap-1 mb-2 text-xs font-medium text-[var(--neon)]">
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </span>
                    )}
                    <p className="font-semibold leading-tight">{p.name}</p>
                    {p.product_type === "fixed" || !p.price_per_unit ? (
                      <p className="mt-1 neon-text text-lg font-bold">
                        {formatIDR(Number(p.price))}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatIDR(Number(p.price_per_unit))} / {meta?.unitLabel ?? "unit"}
                      </p>
                    )}
                    {p.min_quantity != null && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Min: {p.min_quantity.toLocaleString()}
                      </p>
                    )}
                    {active && (
                      <Check className="absolute top-3 right-3 h-5 w-5 text-[var(--neon)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom quantity panel */}
            {isCustomQty && selected && (
              <div className="mt-6 glass rounded-2xl p-5 border border-[var(--neon)]/20">
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const meta = PRODUCT_TYPE_META[selected.product_type ?? ""];
                    const Icon = meta?.icon;
                    return Icon ? <Icon className="h-4 w-4 text-[var(--neon)]" /> : null;
                  })()}
                  <h3 className="font-semibold text-sm">
                    Choose Quantity —{" "}
                    {PRODUCT_TYPE_META[selected.product_type ?? ""]?.label}
                  </h3>
                </div>
                <QuantitySelector
                  value={quantity}
                  min={selected.min_quantity ?? 1}
                  onChange={setQuantity}
                  unitLabel={
                    PRODUCT_TYPE_META[selected.product_type ?? ""]?.unitLabel ?? "units"
                  }
                />
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--neon)]/5 border border-[var(--neon)]/20 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {quantity.toLocaleString()} ×{" "}
                    {formatIDR(Number(selected.price_per_unit))}
                  </span>
                  <span className="text-lg font-bold neon-text">{formatIDR(totalPrice)}</span>
                </div>
              </div>
            )}
          </Step>

          {/* Step 3 */}
          <Step n={3} title="Payment">
            <div className="rounded-xl p-4 glass">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary">
                  <QrCode className="h-5 w-5 text-[var(--neon)]" />
                </div>
                <div>
                  <p className="font-semibold">QRIS Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Pay via QRIS, then confirm payment through WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </Step>
        </div>

        {/* Sidebar */}
        <aside className="glass-strong rounded-2xl p-6 h-fit sticky top-20 max-lg:static max-lg:mt-6">
          <h3 className="font-bold text-lg">Order Summary</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Game" value={game.name} />
            <Row label={game.user_id_label} value={userGameId || "—"} />
            {game.requires_server_id && <Row label="Server" value={serverId || "—"} />}
            {isSocialMedia && userInput && <Row label="Profile" value={userInput} />}
            <Row label="Package" value={selected?.name ?? "—"} />
            {isCustomQty && selected && (
              <Row
                label="Quantity"
                value={`${quantity.toLocaleString()} ${
                  PRODUCT_TYPE_META[selected.product_type ?? ""]?.unitLabel ?? "units"
                }`}
              />
            )}
            <Row label="Payment" value="QRIS" />
          </dl>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className="text-2xl font-bold neon-text">
              {selected ? formatIDR(totalPrice) : "—"}
            </span>
          </div>
          <Button
            onClick={handleBuy}
            disabled={
              submitting ||
              !productId ||
              !userGameId.trim() ||
              (isCustomQty && quantity < (selected?.min_quantity ?? 1))
            }
            className="mt-5 w-full h-11 bg-[var(--gradient-primary)] text-primary-foreground hover:opacity-90 neon-ring disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy now"}
          </Button>
          {isCustomQty && selected?.min_quantity != null && quantity < selected.min_quantity && (
            <p className="mt-2 text-xs text-red-400 text-center">
              Minimum {selected.min_quantity.toLocaleString()}{" "}
              {PRODUCT_TYPE_META[selected.product_type ?? ""]?.unitLabel}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            After purchase, pay via QRIS and confirm payment through WhatsApp.
          </p>
        </aside>
      </div>

      <QrisModal open={qrisModalOpen} onClose={() => setQrisModalOpen(false)} />
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
