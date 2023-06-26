import { afterEach, beforeEach, bench, describe, expect, it } from "vitest";
import { EntityDB } from "./EntityDB";
import Database from "better-sqlite3";
import { JSONDB } from "./JSONDB";

type Foo = {
  id: string;
  name: string;
  x: number;
  y: number;
  inCombat?: boolean;
  complex?: { foo: string };
};

describe("EntityDB", () => {
  let db: EntityDB<Foo>;

  function setup() {
    const s = new Database(":memory:");
    s.pragma("journal_mode = WAL");
    s.pragma("synchronous = off");
    const jsonDB = new JSONDB(s);
    db = new EntityDB<Foo>({
      indices: ["name", "x"],
      jsonDB,
      persistAfterChangeCount: 100,
    });
  }

  function teardown() {
    db.close();
  }

  bench(
    "create 10'000 entities",
    () => {
      for (let i = 0; i < 10_000; i++) {
        db.create({
          name: "first",
          x: 1,
          y: 3,
          inCombat: false,
        });
      }
    },
    { setup, teardown }
  );

  bench(
    "update entity 10'000 times",
    () => {
      const created = db.create({
        name: "first",
        x: 1,
        y: 3,
        inCombat: false,
      });

      for (let i = 0; i < 10_000; i++) {
        created.name = "updated";
        created.inCombat = true;
        db.update(created);
      }
    },
    { setup, teardown }
  );
});
