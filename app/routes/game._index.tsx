import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import type { FetcherWithComponents } from "@remix-run/react";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { Avatar } from "~/components/avatar/Avatar";
import type { WorldMapTile } from "~/engine/WorldMapService";
import type { Player } from "~/engine/core";
import { useEventSource } from "remix-utils";
import type { ClientEvent } from "~/engine/ClientEventService";
import { StoreContext, createGameStore, useGameStore } from "~/store";
import { useStore } from "zustand";
import { tileRenderedSize, viewportHeight, viewportWidth } from "~/config";
import { render } from "react-dom";

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

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const x = formData.get("x");
  const y = formData.get("y");
  const player = await container.sessionService.requirePlayer(request);
  if (player == null) {
    return redirect("/");
  }

  if (
    typeof x === "string" &&
    typeof y === "string" &&
    x !== null &&
    y !== null &&
    container.walkService.canWalk(player, parseInt(x), parseInt(y))
  ) {
    container.walkService.startWalk(player, parseInt(x), parseInt(y));
  }
  return null;
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

function Tile({
  player,
  tile,
  fetcher,
}: {
  player: Player;
  tile: WorldMapTile;
  fetcher: FetcherWithComponents<any>;
}) {
  function handleClick() {
    if (!tile.obstacle) {
      fetcher.submit(
        { type: "walk", x: String(tile.x), y: String(tile.y) } as any,
        { method: "post" }
      );
    }
  }

  const isCenter = player ? tile.x === player.x && tile.y === player.y : false;
  // TODO add WASDZ controls for walking
  const [ground, ...layers] = tile.imagePaths;

  const showWalkPattern = false;

  const left = tileRenderedSize * tile.x;
  const top = tileRenderedSize * tile.y;

  return (
    <div
      onClick={handleClick}
      style={{ top, left }}
      className={`absolute h-[96px] w-[96px] ${
        !tile.obstacle ? "cursor-pointer" : ""
      }`}
    >
      {isCenter && <Avatar />}
      <div
        className={`${
          showWalkPattern ? "opacity-100" : "opacity-0"
        } absolute z-20 h-full w-full rounded-3xl backdrop-brightness-125 transition-opacity duration-75`}
      ></div>
      <div
        className={`absolute z-10 h-full w-full bg-stone-900 opacity-10`}
      ></div>
      {layers.map((image, idx) => {
        return (
          <img
            alt=""
            draggable={false}
            className="absolute h-full w-full"
            style={{
              userSelect: "none",
              imageRendering: "pixelated",
              zIndex: `${idx + 1}`,
            }}
            key={image}
            src={`/${image}`}
          ></img>
        );
      })}
      <img
        alt=""
        width="96"
        height="96"
        className="h-full w-full"
        draggable={false}
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: "1",
        }}
        src={`/${ground}`}
      ></img>
    </div>
  );
}

function TileLayer({ fetcher }: { fetcher: FetcherWithComponents<any> }) {
  const store = useGameStore();
  const [player, tiles] = useStore(store, (state) => [
    state.player,
    state.tiles,
  ]);

  return tiles.map((tile) => (
    <Tile player={player} fetcher={fetcher} key={tile.id} tile={tile} />
  ));
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

function Menu() {
  return <div className="rounded bg-white p-4 shadow">THis is the menu</div>;
}

export default function Game() {
  const { tiles, player, hasPasswordSet } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  const event = useEventSource("/sse/events", { event: "event" });

  const parsedEvent = event ? (JSON.parse(event) as ClientEvent) : null;

  if (parsedEvent) {
    player.x = parsedEvent.x;
    player.y = parsedEvent.y;
  }
  // {!hasPasswordSet && (
  //   <div className="absolute z-50 w-full">
  //     <PasswordWarning />
  //   </div>
  // )}

  const store = createGameStore(player, tiles);

  const translateX = -tileRenderedSize * player.x - tileRenderedSize / 2;
  const translateY = -tileRenderedSize * player.y - tileRenderedSize / 2;

  return (
    // <div className="relative left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[2.0] transform lg:scale-100">
    <div className="h-full overflow-hidden">
      <StoreContext.Provider value={store}>
        <div className="relative left-[37.5%] top-1/2 origin-center scale-75 transform lg:left-1/2 lg:scale-100">
          <div
            className="relative"
            style={{
              transform: `translate(${translateX}px, ${translateY}px);`,
            }}
          >
            {/* <ActionLayer />
      <DroppedItemsLayer />
      <CharacterLayer />
      <NPCLayer /> */}
            <TileLayer fetcher={fetcher} />
          </div>
        </div>
        <div className="fixed bottom-5 right-5">
          <Menu />
        </div>
      </StoreContext.Provider>
    </div>
  );
}
