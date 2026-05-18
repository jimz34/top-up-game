import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Public: list active games (optionally only popular)
export const listGames = createServerFn({ method: "GET" })
  .inputValidator((input: { popularOnly?: boolean } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin.from("games").select("id, slug, name, publisher, category, image_url, is_popular, requires_server_id, user_id_label").eq("is_active", true).order("is_popular", { ascending: false }).order("name");
    if (data.popularOnly) q = q.eq("is_popular", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getGameWithProducts = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { data: game, error: ge } = await supabaseAdmin
      .from("games").select("*").eq("slug", data.slug).eq("is_active", true).maybeSingle();
    if (ge) throw new Error(ge.message);
    if (!game) return null;
    const { data: products, error: pe } = await supabaseAdmin
      .from("products").select("id, name, price, sort_order").eq("game_id", game.id).eq("is_active", true).order("sort_order");
    if (pe) throw new Error(pe.message);
    return { game, products: products ?? [] };
  });

// Auth: create transaction (MVP — mock payment, no Midtrans yet)
export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      gameId: z.string().uuid(),
      productId: z.string().uuid(),
      userGameId: z.string().min(1).max(64),
      serverId: z.string().max(32).optional().nullable(),
      paymentMethod: z.enum(["wallet", "qris", "bank_transfer", "gopay", "ovo"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const { data: product, error: pe } = await supabaseAdmin
      .from("products").select("id, price, cost, game_id").eq("id", data.productId).eq("is_active", true).maybeSingle();
    if (pe || !product) throw new Error("Product not found");
    if (product.game_id !== data.gameId) throw new Error("Product/game mismatch");

    const orderId = `NT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Wallet path: deduct balance atomically (best-effort with admin client)
    if (data.paymentMethod === "wallet") {
      const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
      const bal = Number(wallet?.balance ?? 0);
      if (bal < Number(product.price)) throw new Error("Insufficient wallet balance");
      const newBal = bal - Number(product.price);
      const { error: we } = await supabaseAdmin.from("wallets").update({ balance: newBal, updated_at: new Date().toISOString() }).eq("user_id", userId);
      if (we) throw new Error(we.message);
      await supabaseAdmin.from("wallet_history").insert({
        user_id: userId, amount: -Number(product.price), type: "deduction",
        description: `Order ${orderId}`, balance_after: newBal,
      });
    }

    // Insert as the user so RLS-owned writes are auditable
    const { data: tx, error: te } = await supabase.from("transactions").insert({
      order_id: orderId,
      user_id: userId,
      game_id: data.gameId,
      product_id: data.productId,
      user_game_id: data.userGameId,
      server_id: data.serverId ?? null,
      amount: product.price,
      cost: product.cost,
      profit: Number(product.price) - Number(product.cost),
      payment_method: data.paymentMethod,
      status: data.paymentMethod === "wallet" ? "processing" : "pending",
    }).select("order_id, status").single();
    if (te) throw new Error(te.message);

    return { orderId: tx.order_id, status: tx.status };
  });

export const listMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("transactions")
      .select("id, order_id, amount, status, payment_method, created_at, user_game_id, server_id, games(name, slug), products(name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
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
  });
