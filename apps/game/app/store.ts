import { create as createStore } from "zustand";
import type { Player } from "@wwyb/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";
import type { ClientEvent } from "./engine/ClientEventService";
import { handleEvent } from "./events";
import { EntityDB } from "@wwyb/entitydb";

// client state
// - menuOpen: null | "inventory" | "equipment" | "combat"
// - playerMapTiles: (x, y) -> tile
// - walking: player, fromX, fromY, starttime
// - hit: player, npc, damage, starttime
// - inventory: gold, inventoryItems (include possible actions)
// - textBoxes (player, text)
// - playerEquipment (specific to current player)
// - playerCombatStats (includes buffs)

export type State = {
  // me
  player: Player;
  playerWalking: boolean;
  openMenu: null | "inventory" | "settings" | "character";
  // world
  tiles: EntityDB<WorldMapTile>;
  players: EntityDB<Player>;
  handleEvent: (event: string | null) => void;
  startWalking: () => void;
};

export type SetFunction = (
  partial: State | Partial<State> | ((state: State) => State | Partial<State>),
  replace?: boolean | undefined
) => void;

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (
  player: Player,
  players: Player[],
  tiles: WorldMapTile[]
) => {
  return createStore<State>()((set) => ({
    openMenu: null,
    player,
    // we could solve animation with zustand subscriptions
    playerWalking: false,
    tiles: new EntityDB<WorldMapTile>({ spatial: true }).fromArray(tiles),
    players: new EntityDB<Player>({ fields: ["id"] }).fromArray(players),
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
