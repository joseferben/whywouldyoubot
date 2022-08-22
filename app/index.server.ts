import { messageRepository } from "./models/message.server";
import { npcRepository } from "./models/npc.server";
import { userRepository } from "./models/user.server";

export async function createIndexes() {
  console.log("create indexes");
  await npcRepository.createIndex();
  await userRepository.createIndex();
  await messageRepository.createIndex();
}
