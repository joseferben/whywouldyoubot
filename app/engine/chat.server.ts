import { Observable } from "observable-fns";
import invariant from "tiny-invariant";
import { ChatMessage, createChatMessage } from "../models/message.server";
import { User } from "../models/user.server";

type ChatListener = (m: ChatMessage) => void;

let listeners: ChatListener[];

declare global {
  var __listeners__: ChatListener[];
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  listeners = [];
} else {
  if (!global.__listeners__) {
    global.__listeners__ = [];
  }
  listeners = global.__listeners__;
}

function onChatMessage(f: ChatListener) {
  console.log("onChatMessage()");
  invariant(typeof f === "function", "chat listener has to be a function");

  console.log("onChatMessage() changing f");
  listeners.push(f);
}

const observable: Observable<ChatMessage> = new Observable((observer) => {
  onChatMessage((m: ChatMessage) => observer.next(m));
});

async function message({ user, message }: { user: User; message: string }) {
  const m = await createChatMessage({ message, user });
  listeners.forEach((f) => f(m));
}

invariant(observable !== undefined, "chat can not be undefined");

export { message, observable };
