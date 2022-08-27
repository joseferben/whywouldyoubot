import { Client } from "redis-om";

let db: Client;

declare global {
  var __db__: Client;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  db = new Client();
} else {
  if (!global.__db__) {
    global.__db__ = new Client();
  }
  db = global.__db__;
  db.open(process.env.REDIS_URL);
}

export async function open() {
  await db.open(process.env.REDIS_URL);
}

export { db };
