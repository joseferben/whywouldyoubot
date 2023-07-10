import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { StoreContext, createGameStore } from "~/store";
import { DOMRenderer } from "~/components/domRenderer/DOMRenderer";
import { Menu } from "~/components/menu/Menu";
import { EventSource } from "~/components/eventSource/EventSource";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await container.sessionService.requireUser(request);
  const player = container.playerService.findByUserId(user.id);
  if (!player) return redirect("/");
  const tiles = container.mapService.findTilesByPlayer(player);
  const goldAmount = container.inventoryService.findGoldAmount(player);
  return json({
    goldAmount,
    tiles,
    player,
    hasPasswordSet: user.password !== null,
  });
};

function PasswordWarning() {
  return (
    <div className="alert alert-info rounded-none text-xs shadow-lg md:text-sm lg:text-base">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 flex-shrink-0 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          You have no password set. If you log out, you won't be able to log
          back in.{" "}
          <Link className="underline" to="/game/settings/password">
            Set a password
          </Link>{" "}
          to keep your progress.
        </span>
      </div>
    </div>
  );
}

// client state
// - menuOpen: null | "inventory" | "equipment" | "combat"
// - playerMapTiles: (x, y) -> tile
// - walking: player, fromX, fromY, starttime
// - hit: player, npc, damage, starttime
// - inventory: gold, inventoryItems (include possible actions)
// - textBoxes (player, text)
// - playerEquipment (specific to current player)
// - playerCombatStats (includes buffs)

// {!hasPasswordSet && (
//   <div className="absolute z-50 w-full">
//     <PasswordWarning />
//   </div>
// )}

type Props = Awaited<ReturnType<Awaited<ReturnType<typeof loader>>["json"]>>;

function Game(initialData: Props) {
  const { tiles, player } = initialData;
  const store = createGameStore(player, tiles);

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
