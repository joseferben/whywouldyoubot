import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { StoreContext, createGameStore } from "~/store";
import { DOMRenderer } from "~/components/domRenderer/DOMRenderer";
import { Menu } from "~/components/menu/Menu";
import { EventSource } from "~/components/eventSource/EventSource";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  const players = container.playerService.findAroundPlayer(player);
  const tiles = container.mapService.findTilesByPlayer(player);
  const goldAmount = container.inventoryService.findGoldAmount(player);
  return json({
    goldAmount,
    tiles,
    players,
    player,
  });
};

type Props = Awaited<ReturnType<Awaited<ReturnType<typeof loader>>["json"]>>;

function Game(initialData: Props) {
  const { tiles, players, player } = initialData;
  const store = createGameStore(player, players, tiles);

  return (
    <StoreContext.Provider value={store}>
      <EventSource />
      <div className="h-full overflow-hidden">
        <DOMRenderer />
        <div className="fixed bottom-5 right-5">
          <Menu />
        </div>
      </div>
    </StoreContext.Provider>
  );
}

export default function Loader() {
  const initialData = useLoaderData<typeof loader>();
  return <Game {...initialData} />;
}
