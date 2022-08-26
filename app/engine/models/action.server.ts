import { Entity, Schema } from "redis-om";
import { redis } from "~/engine/db.server";
import { User } from "./user.server";

export interface Action {
  entityId: string;
  name: string;
  thingId: string;
  userIds: string[];
}

export class Action extends Entity {}

const actionSchema = new Schema(
  Action,
  {
    name: { type: "string", indexed: true },
    thingId: { type: "string", indexed: true },
    userIds: { type: "string[]", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export type ActionHandler = (action: Action) => Promise<void>;

const actionHandlers: { [k: string]: ActionHandler } = {};

export function registerActionHandler(action: string, handler: ActionHandler) {
  console.log(`register action handler ${action}`);
  actionHandlers[action] = handler;
}

export const actionRepository = redis.fetchRepository(actionSchema);

export async function handleAction(action: Action) {
  const handler = actionHandlers[action.name];
  if (handler) {
    await handler(action);
  } else {
    throw new Error(`can't handle action ${action.name}, don't know how`);
  }
}

export async function createAction(user: User, thingId: string, name: string) {
  const action = await actionRepository.createAndSave({
    thingId,
    name,
    users: [user.entityId],
  });
  setTimeout(() => {
    handleAction(action);
  }, 0);
}
