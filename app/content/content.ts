import * as npcKinds from "~/content/npc";
import * as itemKinds from "~/content/resource";
import * as resoureceKinds from "~/content/resource";
import { ItemKind } from "~/engine/core/item";
import { NpcKind, NpcKinds } from "~/engine/core/npc";
import { ResourceKind } from "~/engine/core/resource";

export function getResourceKind(name: string): ResourceKind | null {
  // @ts-ignore
  return resoureceKinds[name];
}

export function getNpcKinds(): NpcKinds {
  return npcKinds;
}

export function getNpcKind(name: string): NpcKind | null {
  // @ts-ignore
  return npcKinds[name];
}

export function getItemKind(name: string): ItemKind | null {
  // @ts-ignore
  return itemKinds[name];
}
