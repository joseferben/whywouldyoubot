import { createClient, RedisClientType } from "redis";

let pubsub: RedisClientType;

declare global {
  var __pubsub__: RedisClientType;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  pubsub = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  if (!global.__pubsub__) {
    global.__pubsub__ = createClient({
      url: process.env.REDIS_URL,
    });
  }
  pubsub = global.__pubsub__;
  pubsub.connect();
}

export async function connect() {
  await pubsub.connect();
}

export { pubsub };
