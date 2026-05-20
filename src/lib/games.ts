import mlbb from "@/assets/game-mlbb.jpg";
import ff from "@/assets/game-freefire.jpg";
import pubg from "@/assets/game-pubg.jpg";
import valo from "@/assets/game-valorant.jpg";
import gi from "@/assets/game-genshin.jpg";
import hok from "@/assets/game-honorofkings.jpg";

export const GAME_IMAGES: Record<string, string> = {
  "mobile-legends": mlbb,
  "free-fire": ff,
  "pubg-mobile": pubg,
  valorant: valo,
  "genshin-impact": gi,
  "honor-of-kings": hok,
  instagram: "https://images.pexels.com/photos/1743498/pexels-photo-1743498.jpeg?auto=compress&cs=tinysrgb&w=512",
  tiktok: "https://images.pexels.com/photos/6025496/pexels-photo-6025496.jpeg?auto=compress&cs=tinysrgb&w=512",
};

export function gameImage(slug: string): string {
  return GAME_IMAGES[slug] ?? mlbb;
}

export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
