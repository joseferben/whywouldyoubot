import { Observable } from "observable-fns";
import invariant from "tiny-invariant";
import { ChatMessage, createChatMessage } from "~/engine/models/message.server";
import { User } from "~/engine/models/user.server";
import { publisher, subscriber } from "./pubsub.server";

const PUBSUB_CHANNEL_NAME = "chat";

const observableChat: Observable<ChatMessage> = new Observable((observer) => {
  subscriber.subscribe(PUBSUB_CHANNEL_NAME, (json) => {
    const m: ChatMessage = JSON.parse(json);
    observer.next(m);
  });
});

async function message({ user, message }: { user: User; message: string }) {
  const m = await createChatMessage({ message, user });
  await publisher.publish(PUBSUB_CHANNEL_NAME, JSON.stringify(m));
}

invariant(observableChat !== undefined, "chat can not be undefined");

export { message, observableChat };
