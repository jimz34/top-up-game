import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listGames } from "@/lib/topup.functions";
import { gameImage } from "@/lib/games";

export const Route = createFileRoute("/games/")({
  head: () => ({
    meta: [
      { title: "All Games — NeonTop Gaming Top-Up" },
      { name: "description", content: "Browse all supported games for instant top-up." },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const fetchGames = useServerFn(listGames);
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games", "all"],
    queryFn: () => fetchGames({ data: {} }),
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-bold">All Games</h1>
      <p className="text-muted-foreground mt-2">Pick a game to start your top-up.</p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl aspect-[4/5] animate-pulse" />
            ))
          : games.map((g) => (
              <Link key={g.id} to="/games/$slug" params={{ slug: g.slug }}
                className="group glass rounded-2xl overflow-hidden hover-glow">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={gameImage(g.slug)} alt={g.name} loading="lazy" width={512} height={640}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <p className="font-semibold truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{g.publisher}</p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
