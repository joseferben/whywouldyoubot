import { create as createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  Player,
  ServerEvent,
  WorldMapTile,
  ClientState,
} from "@wwyb/core";
import { createContext, useContext } from "react";
import { handleEvent } from "./handleEvent";

enableMapSet();

export type UIState = {
  activeMenu: null | "inventory" | "settings" | "character" | "bots";
  animations: Map<string, "walk" | "idle" | "combat">;
};

export type Actions = {
  handleEvent: (event: string | null) => void;
  startWalking: () => void;
  setActiveMenu: (menu: UIState["activeMenu"]) => void;
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
      activeMenu: null,
      me: player.id,
      ground: tiles,
      players: new Map(players.map((p) => [p.id, p])),
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
      setActiveMenu: (menu: UIState["activeMenu"]) => {
        set((state) => {
          state.activeMenu = menu;
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
