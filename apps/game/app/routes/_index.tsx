import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { StoreContext, createGameStore } from "~/store";
import { DOMRenderer } from "~/components/DOMRenderer";
import { Menu } from "~/components/Menu";
import { EventSource } from "~/components/EventSource";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  if (!container.characterCustomizationService.wasCustomized(player))
    return redirect("/customize");
  const players = container.playerService.findAroundPlayer(player);
  const tiles = container.mapService.findTilesByPlayer(player);
  const goldAmount = container.inventoryService.findGoldAmount(player);
  const bots = container.botService.findByPlayer(player);
  return json({
    goldAmount,
    tiles,
    players,
    player,
    bots,
  });
};

export default function Game() {
  const { tiles, players, player, bots } = useLoaderData<typeof loader>();
  const store = createGameStore(player, players, tiles, bots);

  return (
    <StoreContext.Provider value={store}>
      <EventSource />
      <div className="h-full overflow-hidden">
        <DOMRenderer />
        <Menu />
      </div>
    </StoreContext.Provider>
  );
}
