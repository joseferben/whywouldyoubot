import Database from "better-sqlite3";
import { EntityDB } from "./engine/EntityDB/EntityDB";
import { JSONStore } from "./engine/EntityDB/JSONStore";

type Player = {
  id: string;
  x: number;
  y: number;
  playerName: string;
  sprite: string;
};

const sqliteDb = new Database("");
const jsonStore = new JSONStore(sqliteDb);

const migrations = {
  0: (oldPlayer: any) => ({
    x: oldPlayer.x,
    y: oldPlayer.y,
    playerName: oldPlayer.name,
    sprite: oldPlayer.sprite,
  }),
};

const db = new EntityDB<Player>({
  fields: ["name"],
  spatial: true,
  jsonStore: jsonStore,
  persistenceIntervalMs: 1000,
  persistenceAfterChangeCount: 10,
  persistenceNamespace: "player",
  migrations: migrations,
});

const player = db.create({
  x: 0,
  y: 5,
  playerName: "somename",
  sprite: "player.png",
});

const found = db.findById("someid");

const foundByName = db.findBy("playerName", "somename");

const foundByPosition = db.findByPosition(5, 6);

const foundByPositionRange = db.findByRectangle(5, 6, 10, 10);
