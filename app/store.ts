import { create as createStore } from "zustand";
import type { Player } from "./engine/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";

type State = {
  player: Player;
  tiles: WorldMapTile[];
};

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (player: Player, tiles: WorldMapTile[]) =>
  createStore<State>()((set) => ({
    player,
    tiles,
  }));

export const StoreContext = createContext<GameStore | null>(null);

export function useGameStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing StoreContext.Provider in the tree");
  return store;
}
