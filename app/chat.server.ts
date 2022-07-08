import { ChatMessage, createChatMessage } from "./models/message.server";
import { User } from "./models/user.server";

type ChatListener = (m: ChatMessage) => void;

let chatListeners: ChatListener[] = [];

declare global {
  var __chatListeners__: ChatListener[];
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  chatListeners = [];
} else {
  if (!global.__chatListeners__) {
    global.__chatListeners__ = [];
  }
  chatListeners = global.__chatListeners__;
}

export function onChatMessage(f: ChatListener) {
  chatListeners.push(f);
}

export async function chat({
  userId,
  message,
}: {
  userId: User["entityId"];
  message: string;
}) {
  const m = await createChatMessage({ message, userId });
  console.log("there are n listeners:", chatListeners.length);
  chatListeners.forEach((f) => f(m));
}
