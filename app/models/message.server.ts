import { Entity, Schema } from "redis-om";
import { redis } from "~/db.server";
import { User } from "./user.server";

export interface ChatMessage {
  entityId: string;
  message: string;
  createdAt: Date;
  userId: string;
  username: string;
}
export class ChatMessage extends Entity {}

const chatSchema = new Schema(
  ChatMessage,
  {
    message: { type: "string" },
    createdAt: { type: "date", sortable: true },
    userId: { type: "string" },
    username: { type: "string" },
  },
  {
    dataStructure: "HASH",
  }
);

export const messageRepository = redis.fetchRepository(chatSchema);

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
  user,
}: {
  message: ChatMessage["message"];
  user: User;
}) {
  const now = Date.now();
  return messageRepository.createAndSave({
    message,
    userId: user.entityId,
    username: user.name,
    createdAt: now,
  });
}
