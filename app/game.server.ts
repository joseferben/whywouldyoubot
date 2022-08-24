import { open } from "~/engine/db.server";
import { onStart } from "~/engine/lifecycle.server";
import { spawn } from "~/engine/spawn.server";
import { messageRepository } from "~/models/message.server";
import { npcRepository } from "~/models/npc.server";
import { userRepository } from "~/models/user.server";
import { getNpcKinds } from "./content/content";
import { itemRepository } from "./models/item.server";
import { resourceRepository } from "./models/resource.server";

export async function createIndexes() {
  console.log("create indexes");
  await npcRepository.createIndex();
  await userRepository.createIndex();
  await messageRepository.createIndex();
  await resourceRepository.createIndex();
  await itemRepository.createIndex();
}

function spawnNpcs() {
  console.log("spawn npcs");
  return spawn(getNpcKinds());
}

export async function start() {
  // this will be executed once, not with every hot reload
  await onStart([open, createIndexes, spawnNpcs]);
}
