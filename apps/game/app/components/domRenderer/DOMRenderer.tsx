import { useStore } from "zustand";
import { config } from "~/config";
import { useGameStore } from "~/store";
import type { Player, Action, WorldMapTile } from "@wwyb/core";
import invariant from "tiny-invariant";

const tileRenderedSize = config.tileRenderedSize;

function PlayerTile({ player }: { player: Player }) {
  const store = useGameStore();
  const animation = useStore(store, (state) => state.animations.get(state.me));

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
      className={`absolute z-50 transition-all duration-500 ${
        animation === "walk" ? "animate-wiggle" : ""
      }`}
    >
      <img
        alt=""
        draggable={false}
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: 50,
          width: tileRenderedSize + 1,
          height: tileRenderedSize + 1,
        }}
        src={`/assets/avatars/3.png`}
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
      fetch("/api/actions", {
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
  const [tiles] = useStore(store, (state) => [state.ground]);

  return tiles.map((tile) => <MapTile key={tile.id} tile={tile} />);
}

function PlayersLayer() {
  const store = useGameStore();
  const [players] = useStore(store, (state) => [state.players]);

  return Array.from(players.values()).map((player) => (
    <PlayerTile key={player.id} player={player} />
  ));
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
  const player = useStore(store, (state) => state.players.get(state.me));

  invariant(player, "Player not found");

  const translateX = -tileRenderedSize * player.x - tileRenderedSize / 2;
  const translateY = -tileRenderedSize * player.y - tileRenderedSize / 2;

  return (
    <div className="relative left-1/2 top-1/2">
      <div
        className="relative transition-all duration-1000"
        style={{
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      >
        <ActionLayer />
        <PlayersLayer />
        <DroppedItemsLayer />
        <NPCLayer />
        <TileLayer />
      </div>
    </div>
  );
}
