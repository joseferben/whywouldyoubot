import { open } from "./engine/db.server";
import { onStart } from "./engine/lifecycle.server";
import { spawn } from "./engine/spawn.server";
import { messageRepository } from "./models/message.server";
import { getNpcKindMap, npcRepository } from "./models/npc.server";
import { userRepository } from "./models/user.server";

export async function createIndexes() {
  console.log("create indexes");
  await npcRepository.createIndex();
  await userRepository.createIndex();
  await messageRepository.createIndex();
}

function spawnNpcs() {
  console.log("spawn npcs");
  return spawn(getNpcKindMap());
}

export async function start() {
  // this will be executed once, not with every hot reload
  await onStart([open, createIndexes, spawnNpcs]);
}
