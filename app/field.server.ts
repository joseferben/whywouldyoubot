import { getItemsByRect } from "./models/item.server";
import { getNpc, getNpcsByRect, Npc } from "./models/npc.server";
import {
  getResource,
  getResourcesByRect,
  Resource
} from "./models/resource.server";
import { User } from "./models/user.server";
import { Rectangle } from "./utils";

type Player = { name: string; img: string };
type Action = {
  thingId: string;
  label: string;
  name: string;
  disabled: boolean;
};

export type Interactive = {
  id: string;
  img: string;
  name: string;
  actions: Action[];
  players: Player[];
};

function getFieldRect(user: User): Rectangle {
  return { x: user.posX - 1, y: user.posY - 1, width: 3, height: 3 };
}

function npcsToInteractives(npcs: Npc[], user: User): Interactive[] {
  return npcs.map((npc) => ({
    id: npc.entityId,
    img: npc.kind().image,
    name: `${npc.kind().label} (${npc.level()})`,
    inAction: true,
    actions: [
      {
        thingId: npc.entityId,
        label: "Attack",
        name: "attack",
        disabled: false,
      },
    ],
    players: [],
  }));
}

function resourcesToInteractives(
  resources: Resource[],
  user: User
): Interactive[] {
  return resources.map((resource) => ({
    id: resource.entityId,
    img: resource.kind().image,
    name: resource.kind().label,
    inAction: true,
    actions: [
      {
        thingId: resource.entityId,
        label: "Chop",
        name: "chop",
        disabled: false,
      },
    ],
    players: [],
  }));
}

export async function getInteractives(user: User): Promise<Interactive[]> {
  const rect = getFieldRect(user);
  const npcs = await getNpcsByRect(rect);
  const interactiveNpcs = npcsToInteractives(npcs, user);
  const resources = await getResourcesByRect(rect);
  const interactiveResources = resourcesToInteractives(resources, user);
  return [...interactiveNpcs, ...interactiveResources];
}

export type Item = {
  id: string;
  img: string;
  name: string;
  canPickUp: boolean;
};

export async function getItems(user: User): Promise<Item[]> {
  const rect = getFieldRect(user);
  const items = await getItemsByRect(rect);
  return items.map((item) => ({
    id: item.entityId,
    name: item.kind().label,
    img: item.kind().image,
    canPickUp: true,
  }));
}

export type Field = { description: string; region: string; location: string };

export async function getField(user: User): Promise<Field> {
  return {
    description: "You feel the sun shining on your neck.",
    region: "Clearview",
    location: "Meadows",
  };
}

const npcActions = ["attack"];

async function actNpc(npc: Npc, action: string) {
  // TODO implement
}

const resourceActions = ["chop", "mine", "fish"];

async function actResource(npc: Resource, action: string) {
  // TODO implement
}

export async function handleAction(
  user: User,
  action: string,
  thingId: string
) {
  if (npcActions.includes(action)) {
    const npc = await getNpc(thingId);
    if (npc === null) {
      throw new Error(`npc not found for action ${action}`);
    }
    await actNpc(npc, action);
  } else if (resourceActions.includes(action)) {
    const resource = await getResource(thingId);
    if (resource === null) {
      throw new Error(`resource not found for action ${action}`);
    }
    await actResource(resource, action);
  } else {
    throw new Error(`unknown action ${action} received`);
  }
}
