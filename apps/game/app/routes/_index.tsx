import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { container } from "~/container.server";
import { StoreContext, createGameStore } from "~/store";
import { DOMRenderer } from "~/components/DOMRenderer";
import { Menu } from "~/components/Menu";
import { EventSource } from "~/components/EventSource";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  if (!container.characterCustomizationService.wasCustomized(player))
    return redirect("/customize");
  const players = container.playerService.findAroundPlayer(player);
  const tiles = container.mapService.findTilesByPlayer(player);
  const goldAmount = container.inventoryService.findGoldAmount(player);
  const bots = container.botService.findByOwner(player);
  const availableEmojis = container.emojiService.emojis;
  return json({
    goldAmount,
    tiles,
    players,
    player,
    bots,
    availableEmojis,
  });
};

export default function Game() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { tiles, players, player, bots, availableEmojis } =
    fetcher?.data || loaderData;

  const store = createGameStore(player, players, tiles, bots, availableEmojis);

  useEffect(() => {
    function onFocus() {
      console.log("onFocus()");
      fetcher.load(".");
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetcher]);

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

export const shouldRevalidate = () => false;
