import { openDb } from "~/engine/db.server";
import { onStart } from "~/engine/lifecycle.server";
import { itemRepository } from "~/engine/models/item.server";
import { messageRepository } from "~/engine/models/message.server";
import { npcRepository } from "~/engine/models/npc.server";
import { resourceRepository } from "~/engine/models/resource.server";
import {
    attachTickTimeouts,
    tickRepository
} from "~/engine/models/tick.server";
import { userRepository } from "~/engine/models/user.server";
import { openPubsub } from "~/engine/pubsub.server";
import { spawn } from "~/engine/spawn.server";
import { getNpcKinds } from "./content/content";
import { processTicks } from "./content/tick";

export async function createIndexes() {
  console.log("create indexes");
  await npcRepository.createIndex();
  await userRepository.createIndex();
  await messageRepository.createIndex();
  await resourceRepository.createIndex();
  await itemRepository.createIndex();
  await tickRepository.createIndex();
}

function spawnNpcs() {
  console.log("spawn npcs");
  return spawn(getNpcKinds());
}

export async function start() {
  // this will be executed once, not with every hot reload
  await onStart([
    openDb,
    openPubsub,
    createIndexes,
    spawnNpcs,
    attachTickTimeouts,
    processTicks,
  ]);
}

start();
