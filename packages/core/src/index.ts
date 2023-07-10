import * as npcKinds from "./npc";
import * as itemKinds from "./item";
import * as resourceKinds from "./resource";
import type { ItemKindOpts, ResourceKind, NpcKind, NpcKinds } from "./types";

export * from "./types";
export * from "./events";
export * from "./actions";

export function getResourceKind(name: string): ResourceKind | null {
  // @ts-ignore
  return resourceKinds[name];
}

export function getNpcKinds(): NpcKinds {
  return npcKinds;
}

export function getNpcKind(name: string): NpcKind | null {
  // @ts-ignore
  return npcKinds[name];
}

export function getItemKinds(): { [name: string]: ItemKindOpts } {
  // @ts-ignore
  return itemKinds;
}

export function getItemKind(name: string): ItemKindOpts | null {
  // @ts-ignore
  return itemKinds[name];
}
