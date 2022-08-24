import { Entity, Schema } from "redis-om";
import { redis } from "~/engine/db.server";

export interface Action {
  entityId: string;
  type: "npc" | "resource";
  thingId: string;
  userIds: string[];
}

export class Action extends Entity {}

const actionSchema = new Schema(
  Action,
  {
    type: { type: "string", indexed: true },
    thingId: { type: "string", indexed: true },
    userIds: { type: "string[]", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export const actionRepository = redis.fetchRepository(actionSchema);
