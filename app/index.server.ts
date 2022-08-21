import { messageRepository } from "./models/message.server";
import { npcRepository } from "./models/npc.server";
import { userRepository } from "./models/user.server";

export async function createIndex() {
  await npcRepository.createIndex();
  await userRepository.createIndex();
  await messageRepository.createIndex();
}

// this can be quite expensive to recreate indices during development on every change
createIndex();
