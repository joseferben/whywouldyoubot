import { Observable } from "observable-fns";
import invariant from "tiny-invariant";
import { User } from "~/engine/models/user.server";
import { publisher, subscriber } from "~/engine/pubsub.server";
import { ChatMessage, createChatMessage } from "./models/message.server";
import { refresher } from "./refresher.server";

const PUBSUB_CHANNEL_NAME = "chat";

export const observable: Observable<ChatMessage> = new Observable(
  (observer) => {
    subscriber.subscribe(PUBSUB_CHANNEL_NAME, (json) => {
      const m: ChatMessage = JSON.parse(json);
      observer.next(m);
    });
  }
);

export async function message({
  user,
  message,
}: {
  user: User;
  message: string;
}) {
  const m = await createChatMessage({ message, user });
  await publisher.publish(PUBSUB_CHANNEL_NAME, JSON.stringify(m));
  await refresher.at(user.x, user.y);
}

invariant(observable !== undefined, "chat can not be undefined");

async function local(msg: string, x: number, y: number) {}

const chat = { local };

export { chat };
