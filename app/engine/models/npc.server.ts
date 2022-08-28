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
  posX: number;
  posY: number;
  lastHitAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Npc extends Entity {
  HIT_DELAY_MS = 1000;
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

  canHit(): boolean {
    if (this.lastHitAt !== null) {
      return this.lastHitAt.getDate() <= Date.now() - this.HIT_DELAY_MS;
    } else {
      return false;
    }
  }

  getHitDamage(user: User): number {
    return Math.max(this.attack - user.defense, 0);
  }

  updateLastHitAt() {
    this.lastHitAt = new Date();
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
  npc.updateLastHitAt();
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
    posX,
    posY,
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteNpc(id: Npc["entityId"]) {
  return npcRepository.remove(id);
}
