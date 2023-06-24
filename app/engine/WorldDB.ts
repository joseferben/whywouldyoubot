import type { DroppedItem, Npc } from "~/engine/core";
import { SpatialEntityDB } from "~/engine/SpatialEntityDB";

export const droppedItemType = "dro";
export const npcType = "npc";
export const combatType = "com";
export const playerStatsType = "pls";
export const mapTile = "map";

type Combat = { id: "todo" };
type MapTile = { id: "todo" };
type PlayerStats = {
  id: "todo";
  health: number;
  attackBuff: number;
  defenseBuff: number;
};

type EntityMap = {
  [droppedItemType]: DroppedItem;
  [npcType]: Npc;
  [combatType]: Combat;
  [playerStatsType]: PlayerStats;
  [mapTile]: MapTile;
};

export class WorldDB extends SpatialEntityDB<EntityMap> {}
