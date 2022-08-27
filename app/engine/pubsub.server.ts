import { createClient, RedisClientType } from "redis";

let publisher: RedisClientType;
let subscriber: RedisClientType;

declare global {
  var __publisher__: RedisClientType;
  var __subscriber__: RedisClientType;
}

export async function openPubsub() {
  if (!publisher.isOpen) {
    await publisher.connect();
  }
  if (!subscriber.isOpen) {
    await subscriber.connect();
  }
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  publisher = createClient({
    url: process.env.REDIS_URL,
  });
  subscriber = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  if (!global.__publisher__) {
    global.__publisher__ = createClient({
      url: process.env.REDIS_URL,
    });
  }
  if (!global.__subscriber__) {
    global.__subscriber__ = createClient({
      url: process.env.REDIS_URL,
    });
  }
  publisher = global.__publisher__;
  subscriber = global.__subscriber__;
  openPubsub();
}

export { publisher, subscriber };
