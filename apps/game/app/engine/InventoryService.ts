import type { DroppedItemService } from "./DroppedItemService";
import type { ItemService } from "./ItemService";
import type { Player } from "@wwyb/core";
import { Profiler } from "./Profiler";

export class InventoryService extends Profiler {
  constructor(
    readonly itemService: ItemService,
    readonly droppedItemService: DroppedItemService
  ) {
    super();
  }
  findGoldAmount(player: Player): number {
    return 0;
  }
}
