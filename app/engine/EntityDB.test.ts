// create entitydb and store entity test

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EntityDB } from "./EntityDB";
import Database from "better-sqlite3";

type Foo = {
  id: string;
  name: string;
  x: number;
  y: number;
  inCombat: boolean;
};

const fooType = "foo";

type EntityMap = {
  [fooType]: Foo;
};

let db: EntityDB<EntityMap>;

beforeEach(() => {
  const s = new Database(":memory:", { verbose: console.log });
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  db = new EntityDB(s);
});

afterEach(() => {
  db.close();
});

describe("EntityDB", () => {
  it.only("create foo", () => {
    const created = db.create(fooType, {
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    expect(created.id.startsWith(fooType)).toBe(true);
    const first = db.findById(fooType, created.id);
    expect(first).toHaveProperty("name", "first");
    expect(first?.id.substring(0, 3)).toBe(fooType);
  });
  it("update foo", () => {
    const created = db.create(fooType, {
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    created.name = "updated";
    created.inCombat = true;
    db.update(created);
    const updated = db.findById(fooType, created.id);
    expect(updated).toHaveProperty("name", "updated");
  });
  it("delete foo", () => {
    const created = db.create(fooType, {
      name: "first",
      x: 1,
      y: 3,
      inCombat: false,
    });
    db.delete(created.id);
    const deleted = db.findById(fooType, created.id);
    expect(deleted).toBeNull();
  });
  it("find by field", () => {
    db.create(fooType, { name: "first", x: 1, y: 3, inCombat: false });
    db.create(fooType, { name: "first", x: 5, y: 10, inCombat: false });
    db.create(fooType, { name: "other", x: 1, y: 3, inCombat: false });
    db.create(fooType, { name: "far", x: 30, y: 3, inCombat: false });
    expect(db.findAllByField(fooType, "name", "first")).toHaveLength(2);
    expect(db.findAllByField(fooType, "name", "other")).toHaveLength(1);
    expect(db.findAllByField(fooType, "x", 1)).toHaveLength(2);
  });
  it("find all by type", () => {
    db.create(fooType, { name: "first", x: 1, y: 3, inCombat: false });
    db.create(fooType, { name: "first", x: 5, y: 10, inCombat: false });
    db.create(fooType, { name: "other", x: 1, y: 3, inCombat: false });
    db.create(fooType, { name: "far", x: 30, y: 3, inCombat: false });
    expect(db.findAll(fooType)).toHaveLength(4);
  });
});
