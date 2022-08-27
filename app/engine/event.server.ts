import { Observable } from "observable-fns";
import { publisher, subscriber } from "./pubsub.server";

const PUBSUB_CHANNEL_NAME = "event";

export type Event = { type: string; payload: object };

const observableEvent: Observable<Event> = new Observable((observer) => {
  subscriber.subscribe(PUBSUB_CHANNEL_NAME, (json) => {
    const m: Event = JSON.parse(json);
    observer.next(m);
  });
});

async function publishEvent(event: Event) {
  await publisher.publish(PUBSUB_CHANNEL_NAME, JSON.stringify(event));
}

export { publishEvent, observableEvent };
