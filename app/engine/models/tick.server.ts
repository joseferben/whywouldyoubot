import { Observable } from "observable-fns";
import { Entity, Schema } from "redis-om";
import { db } from "~/engine/db.server";
import { subscriber } from "../pubsub.server";

export interface Tickable {
  lastTickAt: Date | null;
  canTick(): boolean;
}

export interface Tick {
  entityId: string;
  actorId: string;
  targetId: string;
  name: string;
  tickAt: number;
}

export class Tick extends Entity {}

const tickSchema = new Schema(
  Tick,
  {
    actorId: { type: "string", indexed: true },
    targetId: { type: "string", indexed: true },
    name: { type: "string", indexed: true },
    tickAt: { type: "number", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export const tickRepository = db.fetchRepository(tickSchema);

async function getTicks() {
  return tickRepository.search().all();
}

export async function getTick(id: string) {
  return tickRepository.fetch(id);
}

export async function createTick(
  actorId: string,
  targetId: string,
  name: string,
  tickAt: number
) {
  const tick = await tickRepository.createAndSave({
    targetId: targetId,
    actorId: actorId,
    name: name,
    tickAt: tickAt,
  });
  const ttlMs = Date.now() - tickAt;
  tickRepository.expire(tick.entityId, Math.ceil(ttlMs / 1000));
  setTimeout(() => tickRepository.remove(tick.entityId), ttlMs);
  return tick;
}

const PUBSUB_CHANNEL_NAME_DEL = "__keyevent@0__:del";
const PUBSUB_CHANNEL_NAME_EXPIRE = "__keyevent@0__:expire";

export const observable: Observable<string> = new Observable((observer) => {
  subscriber.pSubscribe(PUBSUB_CHANNEL_NAME_DEL, (msg) => {
    observer.next(msg);
  });
  subscriber.pSubscribe(PUBSUB_CHANNEL_NAME_EXPIRE, (msg) => {
    observer.next(msg);
  });
});

export async function attachTickTimeouts() {
  const ticks = await getTicks();
  ticks.forEach((tick) => {
    const ttlMs = Date.now() - tick.tickAt;
    setTimeout(() => tickRepository.remove(tick.entityId), ttlMs);
  });
}
