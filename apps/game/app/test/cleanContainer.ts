import type { Container } from "~/container.server";

/**
 * Reset the state of the container for tests.
 */
export function cleanContainer(container: Container) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Don't clean in production");
  // no need to clean MapService since it's mostly static
  container.playerService.db.clean();
  container.itemService.db.clean();
  container.serverSentService.db.clean();
  container.emojiService.db.clean();
  container.onlineService.db.clean();
  container.botService.db.clean();
  // container.npcService.db.close();
  // container.equipmentService.db.close();
  // container.avatarService.db.close();
  // container.combatStatsService.db.close();
  // container.inventoryService.db.close();
  // container.spawnService.db.close();
  // container.combatService.db.close();
}
