import { useStore } from "zustand";
import { config } from "~/config";
import { useGameStore } from "~/store";
import type { Player, WorldMapTile } from "@wwyb/core";
import invariant from "tiny-invariant";
import { PlayerImage } from "./PlayerImage";

const tileRenderedSize = config.tileRenderedSize;

function BotImage() {
  return (
    <img
      className="z-30 h-full w-full"
      alt="eyes"
      style={{
        userSelect: "none",
        imageRendering: "pixelated",
      }}
      height="16"
      width="16"
      src={`/assets/ui/bots.png`}
    />
  );
}

function PlayerTile({ player }: { player: Player }) {
  const store = useGameStore();
  const animation = useStore(store, (state) => state.animations.get(player.id));

  const left = tileRenderedSize * player.x;
  const top = tileRenderedSize * player.y;

  return (
    <div>
      <div
        style={{
          top: top - 24,
          left,
          width: tileRenderedSize + 1,
        }}
        className="absolute z-50 text-center text-xl text-white transition-all duration-500"
      >
        <span>{player.username}</span>
      </div>
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
        {player.userId ? (
          <PlayerImage
            head={player.avatarHead}
            eyes={player.avatarEyes}
            hair={player.avatarHair}
          />
        ) : (
          <BotImage />
        )}
      </div>
    </div>
  );
}

function MapTile({ tile }: { tile: WorldMapTile }) {
  const store = useGameStore();
  const [startWalking, walkTo] = useStore(store, (state) => [
    state.startWalking,
    state.walkTo,
  ]);

  function handleClick() {
    if (!tile.obstacle) {
      startWalking();
      walkTo(tile.x, tile.y);
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
  const player = useStore(store, (state) => state.players.get(state.me.id));

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
