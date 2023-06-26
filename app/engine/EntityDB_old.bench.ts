// create entitydb and store entity test

import { bench, describe } from "vitest";
import { EntityDB } from "./EntityDB_old";
import Database from "better-sqlite3";

type Foo = {
  id: string;
  name: string;
  playerId?: string;
  x: number;
  y: number;
  should: boolean;
};

const fooType = "foo";

type EntityMap = {
  [fooType]: Foo;
};

const backends = [{ backend: "inmemory" }, { backend: "file" }];
describe.each(backends)("EntityDB $backend", ({ backend }) => {
  let db: EntityDB<EntityMap>;

  function setup() {
    const s =
      backend === "inmemory"
        ? new Database(":memory:")
        : // temp file
          new Database("");
    s.pragma("journal_mode = WAL");
    s.pragma("synchronous = off");
    db = new EntityDB(s);
  }

  function teardown() {
    db.close();
  }

  bench(
    "create 100 entities",
    () => {
      for (let i = 0; i < 100; i++) {
        db.create(fooType, {
          name: "first",
          x: i,
          y: i + 10,
          should: true,
          playerId: String(i),
        });
      }
    },
    { setup, teardown }
  );

  bench(
    "create 10'000 entities w/o transaction",
    () => {
      for (let i = 0; i < 10_000; i++) {
        db.create(
          fooType,
          { name: "first", x: i, y: i + 10, should: true, playerId: String(i) },
          false
        );
      }
    },
    { setup, teardown }
  );

  bench(
    "create 10'000 entities",
    () => {
      for (let i = 0; i < 10_000; i++) {
        db.create(fooType, {
          name: "first",
          x: i,
          y: i + 10,
          should: true,
          playerId: String(i),
        });
      }
    },
    { setup, teardown }
  );

  bench(
    "update entity 100 times",
    () => {
      const created = db.create(fooType, {
        name: "first",
        x: 1,
        y: 3,
        should: true,
        playerId: "1",
      });
      for (let i = 0; i < 100; i++) {
        created.name = "updated" + i;
        db.update(created);
      }
    },
    { setup, teardown }
  );

  bench(
    "update entity 10'000 times w/o transaction",
    () => {
      const created = db.create(fooType, {
        name: "first",
        x: 1,
        y: 3,
        should: true,
        playerId: "1",
      });
      for (let i = 0; i < 10_000; i++) {
        created.name = "updated" + i;
        db.update(created, false);
      }
    },
    { setup, teardown }
  );

  bench(
    "update entity 10'000 times",
    () => {
      const created = db.create(fooType, {
        name: "first",
        x: 1,
        y: 3,
        should: true,
        playerId: "1",
      });
      for (let i = 0; i < 10_000; i++) {
        created.name = "updated" + i;
        db.update(created);
      }
    },
    { setup, teardown }
  );
});
