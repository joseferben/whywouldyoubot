/**
 * Reset the state of the container for tests.
 */
export function cleanContainer(container: Container) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Don't clean in production");
  // no need to clean MapService since it's mostly static
  container.playerService.db.entities = new Map();
  container.itemService.db.entities = new Map();
  container.clientEventService.db.entities = new Map();
  container.onlineService.db.entities = new Map();
  container.botService.db.entities = new Map();
  // container.npcService.db.close();
  // container.equipmentService.db.close();
  // container.avatarService.db.close();
  // container.combatStatsService.db.close();
  // container.inventoryService.db.close();
  // container.spawnService.db.close();
  // container.combatService.db.close();
}
