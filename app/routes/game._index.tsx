import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import type { FetcherWithComponents } from "@remix-run/react";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { container } from "~/container.server";
import { Avatar } from "~/components/avatar/Avatar";
import type { MapTile } from "~/engine/MapService";

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
    container.walkService.walk(player, parseInt(x), parseInt(y));
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
  tile,
  fetcher,
}: {
  tile: MapTile;
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

  // TODO add WASDZ controls for walking
  const [ground, ...layers] = tile.imagePaths;
  const showWalkPattern =
    !tile.obstacle &&
    fetcher.state !== "submitting" &&
    fetcher.state !== "loading";

  return (
    <div
      onClick={handleClick}
      className={`relative ${!tile.obstacle ? "cursor-pointer" : ""}`}
    >
      <Avatar />
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

export default function Game() {
  const { tiles, player, hasPasswordSet } = useLoaderData<typeof loader>();
  console.log(tiles.length);

  //const id = useEventSource("/sse/updates");

  const fetcher = useFetcher();

  return (
    <div className="relative left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-125 transform md:scale-150 lg:scale-100">
      {!hasPasswordSet && (
        <div className="absolute z-50 w-full">
          <PasswordWarning />
        </div>
      )}
      {tiles.map((tile: MapTile) => (
        <Tile fetcher={fetcher} key={`${tile.x},${tile.y}`} tile={tile} />
      ))}
    </div>
  );
}
