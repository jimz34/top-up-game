import { supabase } from "@/integrations/supabase/client";

export async function listGames(opts?: { popularOnly?: boolean }) {
  let q = supabase
    .from("games")
    .select("id, slug, name, publisher, category, image_url, is_popular, requires_server_id, user_id_label")
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("name");
  if (opts?.popularOnly) q = q.eq("is_popular", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getGameWithProducts(slug: string) {
  const { data: game, error: ge } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (ge) throw new Error(ge.message);
  if (!game) return null;
  const { data: products, error: pe } = await supabase
    .from("products")
    .select("id, name, price, sort_order")
    .eq("game_id", game.id)
    .eq("is_active", true)
    .order("sort_order");
  if (pe) throw new Error(pe.message);
  return { game, products: products ?? [] };
}

export async function createTransaction(input: {
  gameId: string;
  productId: string;
  userGameId: string;
  serverId?: string | null;
  paymentMethod: "wallet" | "qris" | "bank_transfer" | "gopay" | "ovo";
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const userId = session.user.id;

  const { data: product, error: pe } = await supabase
    .from("products")
    .select("id, price, cost, game_id")
    .eq("id", input.productId)
    .eq("is_active", true)
    .maybeSingle();
  if (pe || !product) throw new Error("Product not found");
  if (product.game_id !== input.gameId) throw new Error("Product/game mismatch");

  const orderId = `NT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  if (input.paymentMethod === "wallet") {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const bal = Number(wallet?.balance ?? 0);
    if (bal < Number(product.price)) throw new Error("Insufficient wallet balance");
    const newBal = bal - Number(product.price);
    const { error: we } = await supabase
      .from("wallets")
      .update({ balance: newBal, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (we) throw new Error(we.message);
    await supabase.from("wallet_history").insert({
      user_id: userId,
      amount: -Number(product.price),
      type: "deduction",
      description: `Order ${orderId}`,
      balance_after: newBal,
    });
  }

  const { data: tx, error: te } = await supabase
    .from("transactions")
    .insert({
      order_id: orderId,
      user_id: userId,
      game_id: input.gameId,
      product_id: input.productId,
      user_game_id: input.userGameId,
      server_id: input.serverId ?? null,
      amount: product.price,
      cost: product.cost,
      profit: Number(product.price) - Number(product.cost),
      payment_method: input.paymentMethod,
      status: input.paymentMethod === "wallet" ? "processing" : "pending",
    })
    .select("order_id, status")
    .single();
  if (te) throw new Error(te.message);
  return { orderId: tx.order_id, status: tx.status };
}

export async function listMyTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, order_id, amount, status, payment_method, created_at, user_game_id, server_id, games(name, slug), products(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMyWallet() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const userId = session.user.id;
  const [{ data: wallet }, { data: history }, { data: profile }] = await Promise.all([
    supabase.from("wallets").select("balance, updated_at").eq("user_id", userId).maybeSingle(),
    supabase.from("wallet_history").select("id, amount, type, description, balance_after, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("display_name, referral_code").eq("id", userId).maybeSingle(),
  ]);
  return {
    balance: Number(wallet?.balance ?? 0),
    history: history ?? [],
    displayName: profile?.display_name ?? null,
    referralCode: profile?.referral_code ?? null,
  };
}
