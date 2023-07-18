import { create as createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type {
  Player,
  ServerEvent,
  WorldMapTile,
  ClientState,
  Bot,
  Emoji,
} from "@wwyb/core";
import { createContext, useContext } from "react";
import { handleEvent } from "./handleEvent";
import { client } from "@wwyb/sdk";

enableMapSet();

export type UIState = {
  activeMenu: null | "inventory" | "settings" | "character" | "bots" | "emoji";
  animations: Map<string, "walk" | "combat">;
};

export type HumanClientState = {
  bots: Bot[];
};

export type Actions = {
  handleEvent(event: string | null): void;
  startWalking(): void;
  walkTo(x: number, y: number): Promise<void | string>;
  setActiveMenu(menu: UIState["activeMenu"]): void;
  createBot(name: string): Promise<Bot | string>;
  deleteBot(id: string): Promise<void>;
  showEmoji(emoji: Emoji): Promise<void | string>;
};

export type State = ClientState & UIState & HumanClientState & Actions;

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (
  player: Player,
  players: Player[],
  tiles: WorldMapTile[],
  bots: Bot[],
  availableEmojis: Emoji[]
) => {
  return createStore(
    immer<State>((set) => ({
      activeMenu: null,
      me: player,
      bots: bots,
      ground: tiles,
      players: new Map(players.map((p) => [p.id, p])),
      actions: [],
      animations: new Map(),
      npcs: [],
      inventory: [],
      droppedItems: [],
      characterAnimations: new Map(),
      availableEmojis: availableEmojis,
      shownEmojis: new Map(),
      startWalking: (characterId?: string) => {
        set((state) => {
          const id = characterId || state.me.id;
          console.log("start walking", id);
          state.animations.set(id, "walk");
        });
      },
      setActiveMenu: (menu: UIState["activeMenu"]) => {
        set((state) => {
          state.activeMenu = menu;
        });
      },
      createBot: async (name: string) => {
        const created = await client.createBot(name);
        if (typeof created === "string") return created;
        set((state) => {
          state.bots.push(created);
        });
        return created;
      },
      deleteBot: async (id: string) => {
        await client.deleteBot(id);
        set((state) => {
          state.bots = state.bots.filter((b) => b.id !== id);
        });
      },
      walkTo: async (x: number, y: number) => {
        const result = await client.walkTo({ x, y });
        if (typeof result === "string") return result;
      },
      showEmoji: async (emoji: Emoji) => {
        set((state) => {
          state.shownEmojis.set(state.me.id, {
            id: "0",
            playerId: state.me.id,
            emoji,
          });
        });
        const result = await client.showEmoji(emoji);
        if (typeof result === "string") return result;
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
