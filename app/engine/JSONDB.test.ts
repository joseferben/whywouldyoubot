// create entitydb and store entity test

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JSONDB } from "./JSONDB";
import Database from "better-sqlite3";

let db: JSONDB;

beforeEach(async () => {
  const s = new Database(":memory:");
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  db = new JSONDB(s);
});

afterEach(() => {});

describe("JSONDB", () => {
  it("set json", () => {
    db.set("1", { name: "first" });
    const entities = db.all();
    expect(entities).toStrictEqual([{ name: "first" }]);
  });
  it("delete json", () => {
    db.set("1", { name: "first" });
    db.delete("1");
    const entities = db.all();
    expect(entities).toStrictEqual([]);
  });
  it("all json", () => {
    db.set("1", { name: "first" });
    db.set("2", { name: "second" });
    const entities = db.all();
    expect(entities).toStrictEqual([{ name: "first" }, { name: "second" }]);
  });
});
