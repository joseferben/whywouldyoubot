import { Entity, Schema } from "redis-om";
import { redis } from "~/db.server";
import { User } from "./user.server";

export interface ChatMessage {
  entityId: string;
  message: string;
  createdAt: Date;
  userId: string;
}
export class ChatMessage extends Entity {}

const chatSchema = new Schema(ChatMessage, {
  message: { type: "string" },
  createdAt: { type: "date", sortable: true },
  userId: { type: "string" },
});

const messageRepository = redis.fetchRepository(chatSchema);

messageRepository.createIndex();

export function getChatMessage(id: ChatMessage["entityId"]) {
  return messageRepository.fetch(id);
}

export function getChatMessagesByUser(userId: User["entityId"]) {
  return messageRepository
    .search()
    .where("userId")
    .equals(userId)
    .sortDesc("createdAt")
    .returnAll();
}

export function createChatMessage({
  message,
  userId,
}: Pick<ChatMessage, "message" | "userId"> & {
  userId: User["entityId"];
}) {
  const now = Date.now();
  return messageRepository.createAndSave({
    message,
    userId,
    createdAt: now,
  });
}
