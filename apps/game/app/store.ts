import { create as createStore } from "zustand";
import type { Player } from "@wwyb/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";
import type { ClientEvent } from "./engine/ClientEventService";
import { handleEvent } from "./events";

export type State = {
  openMenu: null | "inventory" | "settings" | "character";
  player: Player;
  playerWalking: boolean;
  tiles: WorldMapTile[];
  handleEvent: (event: string | null) => void;
  startWalking: () => void;
};

export type SetFunction = (
  partial: State | Partial<State> | ((state: State) => State | Partial<State>),
  replace?: boolean | undefined
) => void;

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (player: Player, tiles: WorldMapTile[]) => {
  return createStore<State>()((set) => ({
    openMenu: null,
    player,
    playerWalking: false,
    tiles,
    startWalking: () => set({ playerWalking: true }),
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
