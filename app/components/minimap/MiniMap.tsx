import type { FetcherWithComponents } from "@remix-run/react";
import type { Avatar as AvatarType } from "~/engine/avatar/service.server";
import type {
  MiniMap as MiniMapType,
  MiniMapTile,
} from "~/engine/minimap/service.server";
import { Avatar } from "../avatar/Avatar";

function Tile({
  tile,
  fetcher,
  avatars,
}: {
  tile: MiniMapTile;
  fetcher: FetcherWithComponents<any>;
  avatars: AvatarType[];
}) {
  function handleClick() {
    if (tile.canWalk) {
      fetcher.submit(
        { type: "walk", x: String(tile.x), y: String(tile.y) },
        { method: "post" }
      );
    }
  }

  // TODO add WASDZ controls for walking
  const [ground, ...layers] = tile.imagePaths;
  const showWalkPattern =
    tile.canWalk &&
    fetcher.state !== "submitting" &&
    fetcher.state !== "loading";

  return (
    <div
      onClick={handleClick}
      className={`relative ${tile.canWalk ? "cursor-pointer" : ""}`}
    >
      {avatars.map((avatar, idx) => (
        <Avatar key={idx} avatar={avatar} />
      ))}
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

export default function MiniMap({
  miniMap,
  fetcher,
}: {
  miniMap: MiniMapType;
  fetcher: FetcherWithComponents<any>;
}) {
  return (
    <div className="relative top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 scale-125 transform md:scale-150 lg:scale-100">
      {miniMap.tiles.map((cols: any) => (
        <div key={cols[0].x}>
          {cols.map((tile: MiniMapTile) => (
            <Tile
              fetcher={fetcher}
              key={`${tile.x}/${tile.y}`}
              tile={tile}
              avatars={tile.avatars}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
