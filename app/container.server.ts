import Database from "better-sqlite3";
import { DroppedItemService } from "./engine/DroppedItemService";
import { GameDB } from "./engine/GameDB";
import { ItemService } from "./engine/ItemService";
import { MapService } from "./engine/MapService";
import { OnlineService } from "./engine/OnlineService";
import { PlayerService } from "./engine/PlayerService";
import { UserService } from "./engine/UserService";
import { WalkService } from "./engine/WalkService";
import { WorldDB } from "./engine/WorldDB";
import invariant from "tiny-invariant";
import { SessionService } from "./engine/SessionService";
import { getItemKinds } from "./content";
import { InventoryService } from "./engine/InventoryService";
import { config as dotenvConfig } from "dotenv";
import { ImmutableSpatialDB } from "./engine/ImmutableSpatialDB";

function build() {
  dotenvConfig();
  invariant(process.env.SESSION_SECRET, "SESSION_SECRET is required");

  const config = {
    redisConnectionString: process.env.REDIS_CONNECTION_STRING,
    spawnPosition: {
      x: 560,
      y: 580,
    },
    obstacleLayerName: "obstacles",
    mapPath: "map",
    logoutTimeoutMs: 1000 * 10,
    sessionSecret: process.env.SESSION_SECRET,
    userSessionKey: "user",
    items: getItemKinds(),
  };

  const mapService = new MapService(
    new ImmutableSpatialDB(),
    config.obstacleLayerName,
    config.mapPath
  );
  mapService.loadMap();
  const userService = new UserService(game);

  const onlineService = new OnlineService(config.logoutTimeoutMs);
  const playerService = new PlayerService(
    game,
    userService,
    mapService,
    onlineService,
    config.spawnPosition
  );
  const sessionService = new SessionService(
    userService,
    playerService,
    config.sessionSecret,
    config.userSessionKey
  );
  const walkService = new WalkService(mapService, playerService, onlineService);
  const droppedItemService = new DroppedItemService(game, config.items);
  const itemService = new ItemService(game, droppedItemService, config.items);

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
  const inventoryService = new InventoryService(
    itemService,
    droppedItemService
  );
  // const avatarService = new AvatarService(playerService);

  return {
    config,
    userService,
    playerService,
    mapService,
    walkService,
    itemService,
    droppedItemService,
    sessionService,
    // npcService,
    // equipmentService,
    // avatarService,
    // combatStatsService,
    inventoryService,
    // spawnService,
    // combatService,
  };
}

export const container = build();
