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
  paymentMethod: "qris";
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
      status: "waiting_payment",
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

export async function getMyProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const userId = session.user.id;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { displayName: profile?.display_name ?? null };
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: session.user.id,
    _role: "admin",
  });
  if (error) return false;
  return !!data;
}

// Admin functions
export async function adminListTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, order_id, user_id, amount, status, payment_method, created_at, updated_at, user_game_id, server_id, notes, games(name, slug), products(name), profiles!transactions_user_id_fkey(display_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminUpdateTransactionStatus(id: string, status: string) {
  const { error } = await supabase
    .from("transactions")
    .update({ status: status as any, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminListGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminListProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, cost, is_active, sort_order, games(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminListUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at, user_roles(role)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
