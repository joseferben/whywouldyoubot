import type { FetcherWithComponents } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { useStore } from "zustand";
import { tileRenderedSize } from "~/config";
import type { WorldMapTile } from "~/engine/WorldMapService";
import { useGameStore } from "~/store";
import { Avatar } from "../avatar/Avatar";

type Tile = {
  x: number;
  y: number;
  imagePaths: string[];
};

function TileRenderer({
  tile,
  fetcher,
}: {
  tile: Tile;
  fetcher: FetcherWithComponents<any>;
}) {
  const left = tileRenderedSize * tile.x;
  const top = tileRenderedSize * tile.y;

  return (
    <div
      style={{
        top,
        left,
        width: tileRenderedSize,
        height: tileRenderedSize,
      }}
      className="absolute"
    >
      {tile.imagePaths.map((image, idx) => {
        return (
          <img
            alt=""
            draggable={false}
            className="absolute"
            style={{
              userSelect: "none",
              imageRendering: "pixelated",
              zIndex: `${idx + 1}`,
              width: tileRenderedSize,
              height: tileRenderedSize,
            }}
            key={image}
            src={`/${image}`}
          ></img>
        );
      })}
    </div>
  );
}

function MapTile({
  tile,
  fetcher,
}: {
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

  const left = tileRenderedSize * tile.x;
  const top = tileRenderedSize * tile.y;

  return (
    <div
      onClick={handleClick}
      style={{
        top,
        left,
        width: tileRenderedSize,
        height: tileRenderedSize,
      }}
      className={`absolute ${!tile.obstacle ? "cursor-pointer" : ""}`}
    >
      {tile.imagePaths.map((image, idx) => {
        return (
          <img
            alt=""
            draggable={false}
            className="absolute"
            style={{
              userSelect: "none",
              imageRendering: "pixelated",
              zIndex: `${idx + 1}`,
              width: tileRenderedSize,
              height: tileRenderedSize,
            }}
            key={image}
            src={`/${image}`}
          ></img>
        );
      })}
    </div>
  );
}

function TileLayer({ fetcher }: { fetcher: FetcherWithComponents<any> }) {
  const store = useGameStore();
  const [tiles] = useStore(store, (state) => [state.tiles]);

  return tiles.map((tile) => (
    <MapTile fetcher={fetcher} key={tile.id} tile={tile} />
  ));
}

function PlayerLayer() {
  const store = useGameStore();
  const [player, playerWalking] = useStore(store, (state) => [
    state.player,
    state.playerWalking,
  ]);

  const left = tileRenderedSize * player.x;
  const top = tileRenderedSize * player.y;

  return (
    <div
      style={{ top, left, height: tileRenderedSize, width: tileRenderedSize }}
      className={`absolute z-50 transition-all duration-500 ${
        playerWalking ? "animate-wiggle" : ""
      }`}
    >
      <Avatar />
    </div>
  );
}

function ActionLayer() {
  return null;
}

function DroppedItemsLayer() {
  return null;
}

function NPCLayer() {
  return null;
}

export function DOMRenderer() {
  const store = useGameStore();
  const [player] = useStore(store, (state) => [state.player]);

  const translateX = -tileRenderedSize * player.x - tileRenderedSize / 2;
  const translateY = -tileRenderedSize * player.y - tileRenderedSize / 2;
  const fetcher = useFetcher();

  return (
    <div className="relative left-1/2 top-1/2">
      <div
        className="relative transition-all duration-1000"
        style={{
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      >
        <ActionLayer />
        <DroppedItemsLayer />
        <NPCLayer />
        <PlayerLayer />
        <TileLayer fetcher={fetcher} />
      </div>
    </div>
  );
}
