import type { DroppedItemService } from "./DroppedItemService";
import type { ItemService } from "./ItemService";
import type { Player } from "@wwyb/core";

export class InventoryService {
  constructor(
    readonly itemService: ItemService,
    readonly droppedItemService: DroppedItemService
  ) {}
  findGoldAmount(player: Player): number {
    return 0;
  }
}
