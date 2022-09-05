import { Entity, Schema } from "redis-om";
import { NpcKind } from "~/engine/core/npc";

import { getNpcKind } from "~/content/content";
import * as event from "~/content/event";
import { db } from "~/engine/db.server";
import { pickRandomRange, Rectangle } from "~/utils";
import { User, userRepository } from "./user.server";

export interface Npc {
  entityId: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  intelligence: number;
  defense: number;
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Npc extends Entity {
  kind(): NpcKind {
    const kind = getNpcKind(this.name);
    if (!kind) {
      throw new Error(`npc kind ${kind} does not exist`);
    }
    return kind;
  }

  level(): number {
    return this.attack + this.intelligence + this.defense;
  }

  getHitDamage(user: User): number {
    return Math.max(this.attack - user.defense, 0);
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
    x: { type: "number", indexed: true },
    y: { type: "number", indexed: true },
    lastHitAt: { type: "number" },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  {
    dataStructure: "HASH",
  }
);

export const npcRepository = db.fetchRepository(npcSchema);

export async function hitUser(npc: Npc, user: User) {
  const damage = npc.getHitDamage(user);
  user.dealDamage(damage);
  let userDied = false;
  if (user.health <= 0) {
    user.die();
    userDied = true;
  }
  await Promise.all([npcRepository.save(npc), userRepository.save(user)]);
  event.damageDealt(npc, user, damage);
  if (userDied) {
    event.userDied(user);
  }
}

export function getNpc(id: Npc["entityId"]) {
  return npcRepository.fetch(id);
}

export function getNpcsByPos(x: number, y: number) {
  return npcRepository
    .search()
    .where("x")
    .equals(Math.round(x))
    .and("y")
    .equals(Math.round(y))
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
    .where("x")
    .greaterThanOrEqualTo(xMin)
    .and("x")
    .lessThanOrEqualTo(xMax)
    .and("y")
    .greaterThanOrEqualTo(yMin)
    .and("y")
    .lessThanOrEqualTo(yMax);
  return kind
    ? query.where("name").equal(kind.name).returnAll()
    : query.returnAll();
}

export function spawnNpc(kind: NpcKind, x: number, y: number) {
  const npc = {
    name: kind.name,
    health: pickRandomRange(kind.combat.health),
    attack: pickRandomRange(kind.combat.attack),
    intelligence: pickRandomRange(kind.combat.intelligence),
    defense: pickRandomRange(kind.combat.defense),
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
    x,
    y,
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteNpc(id: Npc["entityId"]) {
  return npcRepository.remove(id);
}
