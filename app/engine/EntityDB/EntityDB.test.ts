// create entitydb and store entity test

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { EntityDB } from "./EntityDB";
import { FieldIndex } from "./FieldIndex";
import { Migrator } from "./Migrator";
import { Persistor } from "./Persistor";
import { JSONStore } from "./JSONStore";

type Foo = {
  id: string;
  v: number;
  name: string;
  x: number;
  y: number;
  inCombat?: boolean;
  complex?: { foo: string };
};

let db: EntityDB<Foo>;

beforeEach(async () => {
  const s = new Database(":memory:");
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  const jsonDB = new JSONStore(s);
  db = new EntityDB<Foo>({
    persistor: new Persistor(jsonDB, "foo"),
    fieldIndex: new FieldIndex(["name", "x"]),
  });
});

afterEach(() => {
  db.close();
});

describe("EntityDB", () => {
  it("create foo", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    const first = db.findById(created.id);
    expect(first).toHaveProperty("name", "first");
    expect(first).toHaveProperty("v", 0);
  });
  it("update foo", () => {
    const created = db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    created.name = "updated";
    created.inCombat = true;
    db.update(created);
    const updated = db.findById(created.id);
    expect(updated).toHaveProperty("name", "updated");
  });
  it("find by field", () => {
    db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.create({
      name: "second",
      x: 1,
      y: 3,
    });
    const foundByName = db.findBy("name", "first");
    expect(foundByName).toHaveLength(1);
    expect(foundByName[0]).toHaveProperty("name", "first");
    const foundByX = db.findBy("x", 1);
    expect(foundByX).toHaveLength(2);
  });
  it("find by 2 fields", () => {
    db.create({
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.create({
      name: "second",
      x: 1,
      y: 3,
    });
    const found = db.findByFilter({ name: "first", x: 1 });
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveProperty("name", "first");
  });
  it.only("migrate", () => {
    const s = new Database(":memory:");
    s.pragma("journal_mode = WAL");
    s.pragma("synchronous = off");
    const jsonDB = new JSONStore(s);
    jsonDB.set("123", { id: "123", foo: "bar" }, "fob");

    const migrations = {
      0: (json: { foo: string }) => ({
        fooz: json.foo,
      }),
      1: (json: { fooz: string }) => ({
        fooz: json.fooz,
        hello: "world",
        foor: json.fooz,
      }),
    };
    const testDb = new EntityDB<Foo>({
      migrator: new Migrator(migrations),
      persistor: new Persistor(jsonDB, "fob"),
    });

    const migrated = testDb.findById("123");

    expect(migrated).toHaveProperty("fooz", "bar");
    expect(migrated).toHaveProperty("hello", "world");
    expect(migrated).toHaveProperty("foor", "bar");
    expect(migrated).not.toHaveProperty("foo");
    expect(migrated).toHaveProperty("v", 2);
  });
});
