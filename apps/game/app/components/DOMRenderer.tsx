import { useStore } from "zustand";
import { config } from "~/config";
import { useGameStore } from "~/store";
import type { Action, Player, PotentialAction, WorldMapTile } from "@wwyb/core";
import { PlayerImage } from "~/components/PlayerImage";
import { ContextMenu, ContextMenuItem } from "~/components/ContextMenu";

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
  const [animation, shownEmoji, potentialActionMap, executePotentialAction] =
    useStore(store, (state) => [
      state.animations.get(player.id),
      state.shownEmojis.get(player.id),
      state.potentialActionMap,
      state.executePotentialAction,
    ]);

  const left = tileRenderedSize * player.x;
  const top = tileRenderedSize * player.y;

  function executeDefaultPotentialAction() {
    if (!potentialActionMap) return;
    const p = potentialActionMap.actions[potentialActionMap.default];
    if (p) executePotentialAction(p);
  }

  return (
    <div
      onClick={() => {
        executeDefaultPotentialAction();
      }}
    >
      <div
        style={{
          top: top - 8,
          left,
          width: tileRenderedSize + 1,
          zIndex: 55,
          userSelect: "none",
        }}
        className="absolute text-center text-base text-white transition-all duration-500"
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
          shownEmoji?.emoji?.path ? (
            <div
              className="flex items-center justify-center"
              style={{
                width: tileRenderedSize + 1,
                height: tileRenderedSize + 1,
              }}
            >
              <img
                className="z-50"
                alt="eyes"
                style={{
                  userSelect: "none",
                  imageRendering: "pixelated",
                  width: 50,
                  height: 50,
                }}
                src={shownEmoji.emoji.path}
              />
            </div>
          ) : (
            <PlayerImage
              head={player.avatarHead}
              eyes={player.avatarEyes}
              hair={player.avatarHair}
            />
          )
        ) : (
          <BotImage />
        )}
      </div>
    </div>
  );
}

function MapTile({ tile }: { tile: WorldMapTile }) {
  const store = useGameStore();
  const [startWalking, walkTo, updateTileActions] = useStore(store, (state) => [
    state.startWalking,
    state.walkTo,
    state.updateTileActions,
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
      onMouseEnter={() => updateTileActions({ x: tile.x, y: tile.y })}
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
  const store = useGameStore();
  // TODO add default action everywhere, so we don't have to
  // wait for server (mostly walk, or interact)
  const [potentialActionMap, executePotentialAction] = useStore(
    store,
    (state) => [state.potentialActionMap, state.executePotentialAction]
  );

  return (
    <ContextMenu>
      {potentialActionMap?.actions &&
        Object.keys(potentialActionMap?.actions)
          .sort()
          .map((k) => {
            const tileAction = potentialActionMap?.actions[
              k as Action["tag"]
            ] as PotentialAction;
            return (
              <ContextMenuItem
                onClick={() => executePotentialAction(tileAction)}
                key={tileAction.label}
                label={tileAction.label}
                disabled={tileAction.disabled}
              />
            );
          })}
    </ContextMenu>
  );
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
