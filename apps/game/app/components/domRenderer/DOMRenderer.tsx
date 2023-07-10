import { useStore } from "zustand";
import { tileRenderedSize } from "~/config";
import type { WorldMapTile } from "~/engine/WorldMapService";
import { useGameStore } from "~/store";
import { Avatar } from "../avatar/Avatar";
import type { Action } from "~/action";
import type { Player } from "@wwyb/core";

function PlayerTile({ player }: { player: Player }) {
  const left = tileRenderedSize * player.x;
  const top = tileRenderedSize * player.y;

  return (
    <div
      style={{
        top,
        left,
        width: tileRenderedSize + 1,
        height: tileRenderedSize + 1,
      }}
    >
      <img
        alt=""
        draggable={false}
        className="absolute"
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: `${1}`,
          width: tileRenderedSize + 1,
          height: tileRenderedSize + 1,
        }}
        src={`/avatars/3.png`}
      ></img>
    </div>
  );
}

function MapTile({ tile }: { tile: WorldMapTile }) {
  const store = useGameStore();
  const [startWalking] = useStore(store, (state) => [state.startWalking]);

  function handleClick() {
    startWalking();
    if (!tile.obstacle) {
      fetch("/actions", {
        method: "POST",
        body: JSON.stringify({
          tag: "walk",
          x: tile.x,
          y: tile.y,
        } as Action),
      });
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
        width: tileRenderedSize + 1,
        height: tileRenderedSize + 1,
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
              width: tileRenderedSize + 1,
              height: tileRenderedSize + 1,
            }}
            key={image}
            src={`/${image}`}
          ></img>
        );
      })}
    </div>
  );
}

function TileLayer() {
  const store = useGameStore();
  const [tiles] = useStore(store, (state) => [state.tiles]);

  return tiles.findAll().map((tile) => <MapTile key={tile.id} tile={tile} />);
}

function PlayersLayer() {
  const store = useGameStore();
  const [players] = useStore(store, (state) => [state.players]);

  return (
    <div className="isolate">
      {players.findAll().map((player) => (
        <PlayerTile key={player.id} player={player} />
      ))}
    </div>
  );
}

function PlayerLayer() {
  const store = useGameStore();
  const [x, y, playerWalking] = useStore(store, (state) => [
    state.player.x,
    state.player.y,
    state.playerWalking,
  ]);

  const left = tileRenderedSize * x;
  const top = tileRenderedSize * y;

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
  const [x, y] = useStore(store, (state) => [state.player.x, state.player.y]);

  const translateX = -tileRenderedSize * x - tileRenderedSize / 2;
  const translateY = -tileRenderedSize * y - tileRenderedSize / 2;

  return (
    <div className="relative left-1/2 top-1/2">
      <div
        className="relative transition-all duration-1000"
        style={{
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      >
        <ActionLayer />
        <PlayerLayer />
        <PlayersLayer />
        <DroppedItemsLayer />
        <NPCLayer />
        <TileLayer />
      </div>
    </div>
  );
}
