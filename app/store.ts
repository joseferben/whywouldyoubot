import { create as createStore } from "zustand";
import type { Player } from "./engine/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";
import type { ClientEvent } from "./engine/ClientEventService";

type State = {
  player: Player;
  playerWalking: boolean;
  tiles: WorldMapTile[];
  handleEvent: (event: string | null) => void;
};

type GameStore = ReturnType<typeof createGameStore>;

type SetFunction = (
  partial: State | Partial<State> | ((state: State) => State | Partial<State>),
  replace?: boolean | undefined
) => void;

function handleEvent(set: SetFunction, event: ClientEvent) {
  if (event.tag === "playerStepped") {
    set((state: State) =>
      event.x === state.player.x && event.y === state.player.y
        ? state
        : {
            player: { ...state.player, x: event.x, y: event.y },
            playerWalking: !event.lastStep,
          }
    );
  }
}

export const createGameStore = (player: Player, tiles: WorldMapTile[]) => {
  return createStore<State>()((set) => ({
    player,
    playerWalking: false,
    tiles,
    handleEvent: (event: string | null) => {
      if (!event) return;
      try {
        const parsed = JSON.parse(event) as ClientEvent;
        handleEvent(set, parsed);
      } catch (e) {
        console.error("invalid event received", e);
        return;
      }
    },
  }));
};

export const StoreContext = createContext<GameStore | null>(null);

export function useGameStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing StoreContext.Provider in the tree");
  return store;
}
