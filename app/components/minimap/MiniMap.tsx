import { useFetcher } from "@remix-run/react";
import { getMiniMapByUser, MiniMapTile } from "~/engine/minimap.server";
import imageAvatar from "../../../public/assets/avatars/1.png";

function Tile({ tile }: { tile: MiniMapTile }) {
  const fetcher = useFetcher();

  function handleClick() {
    if (tile.canWalk) {
      fetcher.submit(
        { type: "walk", x: String(tile.x), y: String(tile.y) },
        { method: "post" }
      );
    }
  }

  const [ground, ...layers] = tile.imagePaths;

  return (
    <div
      onClick={handleClick}
      className={`relative ${tile.canWalk ? "cursor-pointer" : ""}`}
    >
      {tile.isCenter && (
        <img
          width="100"
          height="100"
          draggable={false}
          className="absolute z-30"
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
          }}
          src={imageAvatar}
        ></img>
      )}
      <div
        className={`${
          !tile.canSee && !tile.isCenter && "opacity-20 bg-stone-900"
        } z-20 absolute w-full h-full`}
      ></div>
      {layers.map((image, idx) => {
        return (
          <img
            width="100"
            height="100"
            draggable={false}
            className="absolute"
            style={{
              userSelect: "none",
              imageRendering: "pixelated",
              zIndex: `${idx + 1}`,
            }}
            key={image}
            src={`${image}`}
          ></img>
        );
      })}
      <img
        width="100"
        height="100"
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
}: {
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
}) {
  return (
    <div className="flex">
      {miniMap.tiles.map((cols) => (
        <div key={cols[0].x}>
          {cols.map((tile: MiniMapTile) => (
            <Tile key={`${tile.x}/${tile.y}`} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}
