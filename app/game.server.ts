import { openDb } from "~/engine/db.server";
import { onStart } from "~/engine/lifecycle.server";
import { actionRepository } from "~/engine/models/action.server";
import { itemRepository } from "~/engine/models/item.server";
import { messageRepository } from "~/engine/models/message.server";
import { npcRepository } from "~/engine/models/npc.server";
import { resourceRepository } from "~/engine/models/resource.server";
import { userRepository } from "~/engine/models/user.server";
import { openPubsub } from "~/engine/pubsub.server";
import { spawn } from "~/engine/spawn.server";
import { getNpcKinds } from "./content/content";

export async function createIndexes() {
  console.log("create indexes");
  await npcRepository.createIndex();
  await userRepository.createIndex();

  await messageRepository.createIndex();
  await resourceRepository.createIndex();
  await itemRepository.createIndex();
  await actionRepository.createIndex();
}

function spawnNpcs() {
  console.log("spawn npcs");
  return spawn(getNpcKinds());
}

export async function start() {
  // this will be executed once, not with every hot reload
  await onStart([openDb, openPubsub, createIndexes, spawnNpcs]);
}
