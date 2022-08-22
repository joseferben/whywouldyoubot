import { Client } from "redis-om";

let redis: Client;

declare global {
  var __db__: Client;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  redis = new Client();
} else {
  if (!global.__db__) {
    global.__db__ = new Client();
  }
  redis = global.__db__;
  redis.open("redis://localhost:6379");
}

export async function open() {
  await redis.open("redis://localhost:6379");
}

export { redis };
