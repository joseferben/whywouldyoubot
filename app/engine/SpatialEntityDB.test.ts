import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { SpatialEntityDB } from "./SpatialEntityDB";

type Item = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
};

const playerType = "pla";
const itemType = "ite";

type EntityMap = {
  [playerType]: Player;
  [itemType]: Item;
};

let db: SpatialEntityDB<EntityMap>;

beforeEach(() => {
  const s = new Database(":memory:", { verbose: console.log });
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  db = new SpatialEntityDB(s);
});

afterEach(() => {
  db.close();
});

describe("SpatialEntityDB", () => {
  it("find by position", () => {
    db.create(playerType, { name: "first", x: 1, y: 3 });
    db.create(playerType, { name: "second", x: 1, y: 10 });
    db.create(playerType, { name: "fourth", x: 1, y: 3 });
    db.create(itemType, { name: "third", x: 1, y: 3 });
    expect(db.findByPosition(playerType, 1, 3)).toHaveLength(2);
    expect(db.findByPosition(playerType, 1, 10)).toHaveLength(1);
  });
  it("find by rectangle", () => {
    db.create(playerType, { name: "first", x: 1, y: 1 });
    db.create(playerType, { name: "second", x: 1, y: 10 });
    db.create(playerType, { name: "fourth", x: 2, y: 3 });
    db.create(itemType, { name: "third", x: 1, y: 3 });
    expect(db.findByRectangle(playerType, 0, 0, 2, 4)).toHaveLength(2);
    expect(db.findByRectangle(playerType, 0, 0, 2, 2)).toHaveLength(1);
  });
});
