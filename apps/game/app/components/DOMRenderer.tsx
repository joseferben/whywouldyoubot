import { useStore } from "zustand";
import { config } from "~/config";
import { useGameStore } from "~/store";
import type { Player, WorldMapTile } from "@wwyb/core";
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
      src={`/assets/npcs/bot.png`}
    />
  );
}

function PlayerTile({ player }: { player: Player }) {
  const store = useGameStore();
  const [animation, shownEmoji] = useStore(store, (state) => [
    state.animations.get(player.id),
    state.shownEmojis.get(player.id),
  ]);

  const left = tileRenderedSize * player.x;
  const top = tileRenderedSize * player.y;

  return (
    <div>
      <div
        style={{
          top: top - 64,
          left,
          width: tileRenderedSize + 1,
          zIndex: 50,
          userSelect: "none",
        }}
        className={`absolute flex justify-center transition-all duration-500 ${
          shownEmoji?.emoji?.path ? "opacity-100" : "opacity-0"
        }`}
      >
        {shownEmoji?.emoji?.path && (
          <img
            className="z-50 h-16 w-16"
            alt="eyes"
            style={{
              userSelect: "none",
              imageRendering: "pixelated",
            }}
            src={shownEmoji.emoji.path}
          />
        )}
      </div>
      <div
        style={{
          top: top - 16,
          left,
          width: tileRenderedSize + 1,
          zIndex: 55,
          userSelect: "none",
        }}
        className="absolute text-center text-xl text-white transition-all duration-500"
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
          animation === "walk" ? "animate-walk" : "animate-idle"
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

  if (!player) {
    console.error("Player not found");
    return null;
  }

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
