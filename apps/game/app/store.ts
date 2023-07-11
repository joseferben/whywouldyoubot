import { create as createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  DroppedItem,
  Item,
  Npc,
  Player,
  ServerEvent,
  PotentialAction,
} from "@wwyb/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";
import { handleEvent } from "./handleEvent";

enableMapSet();

export type ClientState = {
  me: string;
  actions: PotentialAction[];
  ground: WorldMapTile[];
  npcs: Npc[];
  inventory: Item[];
  droppedItems: DroppedItem[];
  players: Player[];
};

export type UIState = {
  openMenu: null | "inventory" | "settings" | "character";
  animations: Map<string, "walk" | "idle" | "combat">;
};

export type Actions = {
  handleEvent: (event: string | null) => void;
  startWalking: () => void;
};

export type State = ClientState & UIState & Actions;

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (
  player: Player,
  players: Player[],
  tiles: WorldMapTile[]
) => {
  return createStore(
    immer<State>((set) => ({
      openMenu: null,
      me: player.id,
      ground: tiles,
      players: players,
      actions: [],
      animations: new Map(),
      npcs: [],
      inventory: [],
      droppedItems: [],
      characterAnimations: new Map(),
      startWalking: (characterId?: string) => {
        set((state) => {
          const id = characterId || state.me;
          state.animations.set(id, "walk");
        });
      },
      handleEvent: (event: string | null) => {
        if (!event) return;
        try {
          const parsed = JSON.parse(event) as ServerEvent;
          set((state) => handleEvent(state, parsed));
        } catch (e) {
          console.error("invalid event received", e);
          return;
        }
      },
    }))
  );
};

export const StoreContext = createContext<GameStore | null>(null);

export function useGameStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Missing StoreContext.Provider in the tree");
  return store;
}
