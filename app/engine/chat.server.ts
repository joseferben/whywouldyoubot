import { Observable } from "observable-fns";
import invariant from "tiny-invariant";
import { ChatMessage, createChatMessage } from "~/engine/models/message.server";
import { User } from "~/engine/models/user.server";
import { publisher, subscriber } from "./pubsub.server";

const observable: Observable<ChatMessage> = new Observable((observer) => {
  subscriber.subscribe("chat", (json) => {
    const m: ChatMessage = JSON.parse(json);
    observer.next(m);
  });
});

async function message({ user, message }: { user: User; message: string }) {
  const m = await createChatMessage({ message, user });
  await publisher.publish("chat", JSON.stringify(m));
}

invariant(observable !== undefined, "chat can not be undefined");

export { message, observable };
