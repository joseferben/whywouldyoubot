import type { DroppedItem, Npc } from "~/engine/core";
import type { MapTile } from "./MapService";

export const droppedItemType = "dro";
export const npcType = "npc";
export const combatType = "com";
export const playerStatsType = "pls";
export const mapTileType = "til";

// TODO
type Combat = { id: "todo" };
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
  [mapTileType]: MapTile;
};

export class WorldDB {}
