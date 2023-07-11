import { create as createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import type { Player, ServerEvent } from "@wwyb/core";
import type { WorldMapTile } from "./engine/WorldMapService";
import { createContext, useContext } from "react";
import { handleEvent } from "./handleEvent";
import { EntityDB } from "@wwyb/entitydb";

enableMapSet();

// client state
// - menuOpen: null | "inventory" | "equipment" | "combat"
// - playerMapTiles: (x, y) -> tile
// - walking: player, fromX, fromY, starttime
// - hit: player, npc, damage, starttime
// - inventory: gold, inventoryItems (include possible actions)
// - textBoxes (player, text)
// - playerEquipment (specific to current player)
// - playerCombatStats (includes buffs)

type CharacterAnimation = {
  id: string;
  animation: "walk" | "idle" | "combat";
};

export type State = {
  // me
  me: string;
  openMenu: null | "inventory" | "settings" | "character";
  // world
  tiles: EntityDB<WorldMapTile>;
  players: EntityDB<Player>;
  characterAnimations: EntityDB<CharacterAnimation>;
};

export type Actions = {
  handleEvent: (event: string | null) => void;
  startWalking: () => void;
};

type GameStore = ReturnType<typeof createGameStore>;

export const createGameStore = (
  player: Player,
  players: Player[],
  tiles: WorldMapTile[]
) => {
  return createStore(
    immer<State & Actions>((set) => ({
      openMenu: null,
      me: player.id,
      tiles: new EntityDB<WorldMapTile>({ spatial: true }).fromArray(tiles),
      players: new EntityDB<Player>().fromArray(players),
      // players & npc animations
      characterAnimations: new EntityDB<CharacterAnimation>({}),
      startWalking: (characterId?: string) => {
        set((state) => {
          const id = characterId || state.me;
          state.characterAnimations.insert({
            id,
            animation: "walk",
          });
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
