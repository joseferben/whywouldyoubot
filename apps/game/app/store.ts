import { create as createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  Player,
  ServerEvent,
  WorldMapTile,
  ClientState,
  Bot,
} from "@wwyb/core";
import { createContext, useContext } from "react";
import { handleEvent } from "./handleEvent";

enableMapSet();

export type UIState = {
  activeMenu: null | "inventory" | "settings" | "character" | "bots";
  animations: Map<string, "walk" | "idle" | "combat">;
};

export type HumanClientState = {
  bots: Bot[];
};

export type Actions = {
  handleEvent(event: string | null): void;
  startWalking(): void;
  setActiveMenu(menu: UIState["activeMenu"]): void;
  createBot(name: string): Promise<Bot | string>;
};

export type State = ClientState & UIState & HumanClientState & Actions;

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (
  player: Player,
  players: Player[],
  tiles: WorldMapTile[],
  bots: Bot[]
) => {
  return createStore(
    immer<State>((set) => ({
      activeMenu: null,
      me: player.id,
      bots: bots,
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
      createBot: async (name: string) => {
        const created: Bot = await fetch("/api/bots/create/", {
          method: "post",
          body: JSON.stringify({ name: name }),
        }).then((res) => res.json());
        set((state) => {
          state.bots.push(created);
        });
        return created;
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
