import { Entity, Schema } from "redis-om";
import * as npcKinds from "~/content/npc";
import { NpcKind, NpcKindMap } from "~/engine/npc";

import { redis } from "~/engine/db.server";
import { Rectangle } from "~/utils";

export interface Npc {
  entityId: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  intelligence: number;
  defense: number;
  posX: number;
  posY: number;
  createdAt: Date;
  updatedAt: Date;
}

export function getNpcKindMap(): NpcKindMap {
  return npcKinds;
}

export class Npc extends Entity {
  kind(): NpcKind {
    return getNpcKindMap()[this.name];
  }
}

const npcSchema = new Schema(
  Npc,
  {
    name: { type: "string", indexed: true },
    health: { type: "number" },
    maxHealth: { type: "number" },
    attack: { type: "number" },
    intelligence: { type: "number" },
    defense: { type: "number" },
    posX: { type: "number", indexed: true },
    posY: { type: "number", indexed: true },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  {
    dataStructure: "HASH",
  }
);

export const npcRepository = redis.fetchRepository(npcSchema);

function pickRandom(r: [number, number]): number {
  return Math.floor(Math.random() * Math.abs(r[1] - r[0]) + r[0]);
}

export function getNpc(id: Npc["entityId"]) {
  return npcRepository.fetch(id);
}

export function getNpcsByPos(posX: number, posY: number) {
  return npcRepository
    .search()
    .where("posX")
    .equals(Math.round(posX))
    .and("posY")
    .equals(Math.round(posY))
    .returnAll();
}

export function getNpcsByRect(rec: Rectangle, kind?: NpcKind) {
  const { x, y, width, height } = rec;
  const xMin = x;
  const xMax = x + width;
  const yMin = y;
  const yMax = y + height;
  const query = npcRepository
    .search()
    .where("posX")
    .greaterThanOrEqualTo(xMin)
    .and("posX")
    .lessThanOrEqualTo(xMax)
    .and("posY")
    .greaterThanOrEqualTo(yMin)
    .and("posY")
    .lessThanOrEqualTo(yMax);
  return kind
    ? query.where("name").equal(kind.name).returnAll()
    : query.returnAll();
}

export function spawnNpc(kind: NpcKind, posX: number, posY: number) {
  const npc = {
    name: kind.name,
    health: pickRandom(kind.combat.health),
    attack: pickRandom(kind.combat.attack),
    intelligence: pickRandom(kind.combat.intelligence),
    defense: pickRandom(kind.combat.defense),
  };
  const now = Date.now();
  console.log("spawn npc", npc);
  return npcRepository.createAndSave({
    name: npc.name,
    health: npc.health,
    maxHealth: npc.health,
    attack: npc.attack,
    intelligence: npc.intelligence,
    defense: npc.defense,
    posX,
    posY,
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteNpc(id: Npc["entityId"]) {
  return npcRepository.remove(id);
}
