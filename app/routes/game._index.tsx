import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import type { FetcherWithComponents } from "@remix-run/react";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { Avatar } from "~/components/avatar/Avatar";
import type { WorldMapTile } from "~/engine/WorldMapService";
import type { Player } from "~/engine/core";
import { useEventSource } from "remix-utils";
import { ClientEvent } from "~/engine/ClientEventService";

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
        { type: "walk", x: String(tile.x), y: String(tile.y) },
        { method: "post" }
      );
    }
  }

  const isCenter = tile.x === player.x && tile.y === player.y;
  // TODO add WASDZ controls for walking
  const [ground, ...layers] = tile.imagePaths;
  // const showWalkPattern =
  //   !tile.obstacle &&
  //   fetcher.state !== "submitting" &&
  //   fetcher.state !== "loading";
  const showWalkPattern = false;

  return (
    <div
      onClick={handleClick}
      className={`relative ${!tile.obstacle ? "cursor-pointer" : ""}`}
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

function Map({
  x,
  y,
  map,
  player,
  fetcher,
}: {
  x: number;
  y: number;
  map: { [x: number]: { [y: number]: WorldMapTile } };
  player: Player;
  fetcher: FetcherWithComponents<any>;
}) {
  return Object.entries(map).map(([key, row]) => (
    <div key={key}>
      {Object.values(row).map((tile) => (
        <Tile player={player} fetcher={fetcher} key={tile.id} tile={tile} />
      ))}
    </div>
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
export default function Game() {
  const { tiles, player, hasPasswordSet } = useLoaderData<typeof loader>();

  const map: { [x: number]: { [y: number]: WorldMapTile } } = {};

  tiles.forEach((tile) => {
    if (!map[tile.x]) {
      map[tile.x] = {};
    }
    map[tile.x][tile.y] = tile;
  });

  const fetcher = useFetcher();

  const event = useEventSource("/sse/events", { event: "event" });
  const parsedEvent = event ? (JSON.parse(event) as ClientEvent) : null;

  if (parsedEvent) {
    player.x = parsedEvent.x;
    player.y = parsedEvent.y;
  }

  return (
    <div className="relative left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-[2.0] transform lg:scale-100">
      {!hasPasswordSet && (
        <div className="absolute z-50 w-full">
          <PasswordWarning />
        </div>
      )}
      <Map
        x={player.x}
        y={player.y}
        map={map}
        player={player}
        fetcher={fetcher}
      />
    </div>
  );
}
