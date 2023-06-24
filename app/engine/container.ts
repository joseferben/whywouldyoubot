import Database from "better-sqlite3";
import { GameDB } from "./GameDB";
import { WorldDB } from "./WorldDB";
import { MapService } from "./MapService";
import { UserService } from "./UserService";
import { PlayerService } from "./PlayerService";
import { OnlineService } from "./OnlineService";
import { WalkService } from "./WalkService";
import { DroppedItemService } from "./DroppedItemService";
import { ItemService } from "./ItemService";

function buildContainer() {
  const config = {
    dbFilePath: process.env.DB_FILE_PATH || "db.sqlite",
    spawnPosition: {
      x: 0,
      y: 0,
    },
    obstacleLayerName: "obstacles",
    mapPath: "todo",
    logoutTimeoutMs: 1000 * 10,
  };

  const persistentS = new Database(config.dbFilePath);
  persistentS.pragma("journal_mode = WAL");
  persistentS.pragma("synchronous = off");

  const transientS = new Database(":memory:");
  transientS.pragma("journal_mode = WAL");
  transientS.pragma("synchronous = off");

  const gameDB = new GameDB(persistentS);
  const worldDB = new WorldDB(transientS);

  const mapService = new MapService(
    worldDB,
    config.obstacleLayerName,
    config.mapPath
  );
  const userService = new UserService(gameDB);
  const onlineService = new OnlineService(config.logoutTimeout);
  const playerService = new PlayerService(
    gameDB,
    userService,
    mapService,
    onlineService,
    config.spawnPosition
  );
  const itemKinds = {};
  const walkService = new WalkService(mapService, playerService, onlineService);
  const droppedItemService = new DroppedItemService(gameDB, itemKinds);
  const itemService = new ItemService(gameDB, droppedItemService, itemKinds);

  // const equipmentService = new EquipmentService(itemService);
  // const combatStatsService = new CombatStatsService(
  //   itemService,
  //   equipmentService
  // );
  // const npcService = new NpcService(npcRepo, droppedItemService);
  // const spawnService = new SpawnService(npcService, mapService);
  // const combatService = new CombatService(
  //   playerService,
  //   npcService,
  //   droppedItemService
  // );
  // const inventoryService = new InventoryService(
  //   itemService,
  //   droppedItemService
  // );
  // const avatarService = new AvatarService(playerService);

  return {
    config,
    userService,
    playerService,
    mapService,
    walkService,
    itemService,
    droppedItemService,
    // npcService,
    // equipmentService,
    // avatarService,
    // combatStatsService,
    // inventoryService,
    // spawnService,
    // combatService,
  };
}

export const container = buildContainer();
