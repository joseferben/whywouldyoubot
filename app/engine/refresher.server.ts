import { getUsersAt, getUsersByRect, User } from "./models/user.server";

import { Observable } from "observable-fns";
import { publisher, subscriber } from "./pubsub.server";

const PUBSUB_CHANNEL_NAME = "event";

type Refresher = { user: User };

const observable: Observable<Refresher> = new Observable((observer) => {
  subscriber.subscribe(PUBSUB_CHANNEL_NAME, (json) => {
    const r: Refresher = JSON.parse(json);
    observer.next(r);
  });
});

async function publish(event: Refresher) {
  await publisher.publish(PUBSUB_CHANNEL_NAME, JSON.stringify(event));
}

async function user(user: User) {
  await publish({ user });
}

async function atExactly(x: number, y: number) {
  const users = await getUsersAt(x, y);
  await Promise.all(users.map(user));
}
async function at(x: number, y: number) {
  const rect = { x: x - 1, y: y - 1, width: 3, height: 3 };
  const users = await getUsersByRect(rect);
  await Promise.all(users.map(user));
}

const refresher = { user, atExactly, at, observable };

export { refresher };
