import Database from "better-sqlite3";
import invariant from "tiny-invariant";
import { DroppedItemService } from "./engine/DroppedItemService";
import { ItemService } from "./engine/ItemService";
import { WorldMapService } from "./engine/WorldMapService";
import { OnlineService } from "./engine/OnlineService";
import { PlayerService } from "./engine/PlayerService";
import { WalkService } from "./engine/WalkService";
import { SessionService } from "./engine/SessionService";
import { getItemKinds } from "@wwyb/core";
import { InventoryService } from "./engine/InventoryService";
import { config as dotenvConfig } from "dotenv";
import { ServerEventService } from "./engine/ServerEventService";
import { AuthService } from "./engine/AuthService";
import { JSONStore } from "@wwyb/entitydb";

function build() {
  dotenvConfig();
  if (!process.env.SESSION_SECRET)
    throw new Error("SESSION_SECRET is required");
  if (!process.env.DISCORD_CLIENT_ID)
    throw new Error("DISCORD_CLIENT_ID is required");
  if (!process.env.DISCORD_CLIENT_SECRET)
    throw new Error("DISCORD_CLIENT_SECRET is required");
  if (!process.env.DISCORD_CALLBACK_URL)
    throw new Error("DISCORD_CALLBACK_URL is required");

  const config = {
    dbFilePath: process.env.DB_FILE_PATH || "db.sqlite3",
    redisConnectionString: process.env.REDIS_CONNECTION_STRING,
    spawnPosition: {
      x: 560,
      y: 580,
    },
    obstacleLayerName: "obstacles",
    // the client sees n tiles in each direction
    playerVisibility: 20,
    mapPath: "map",
    // how long to wait before logging out idle users
    idleLogoutMs: 1000 * 60 * 5,
    sessionSecret: process.env.SESSION_SECRET,
    userSessionKey: "user",
    items: getItemKinds(),
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordClientSecret: process.env.DISCORD_CLIENT_SECRET,
    discordCallbackUrl: process.env.DISCORD_CALLBACK_URL,
  };

  const s = new Database(config.dbFilePath);
  s.pragma("journal_mode = WAL");
  s.pragma("synchronous = off");
  const jsonStore = new JSONStore(s);

  const worldMapService = new WorldMapService(
    config.obstacleLayerName,
    config.playerVisibility,
    config.mapPath
  );

  const onlineService = new OnlineService(config.idleLogoutMs);
  const playerService = new PlayerService(
    jsonStore,
    worldMapService,
    onlineService,
    config.playerVisibility,
    config.spawnPosition
  );
  const sessionService = new SessionService(
    playerService,
    config.sessionSecret,
    config.userSessionKey
  );
  const authService = new AuthService(
    sessionService,
    playerService,
    config.discordClientId,
    config.discordClientSecret,
    config.discordCallbackUrl
  );

  const clientEventService = new ServerEventService(playerService);

  const walkService = new WalkService(
    clientEventService,
    worldMapService,
    playerService,
    onlineService
  );
  const droppedItemService = new DroppedItemService(config.items);
  const itemService = new ItemService(
    jsonStore,
    droppedItemService,
    config.items
  );

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
    playerService,
    mapService: worldMapService,
    walkService,
    itemService,
    droppedItemService,
    sessionService,
    clientEventService,
    authService,
    onlineService,
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
