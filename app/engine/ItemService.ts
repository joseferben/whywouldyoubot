import type { DroppedItem, Item, ItemKindOpts, Player } from "~/pure/engine/core";
import type { GameDB} from "~/server/engine/GameDB";
import { itemType } from "~/server/engine/GameDB";
import type { DroppedItemService } from "~/server/engine/DroppedItemService";

export class ItemService {
  constructor(
    readonly db: GameDB,
    readonly droppedItemService: DroppedItemService,
    readonly itemKinds: { [name: string]: ItemKindOpts }
  ) {}

  kind(item: Item) {
    return this.kindByName(item.kind);
  }

  image(item: Item) {
    // TODO make path configurable
    return `/assets/images/${this.kind(item).name}`;
  }

  kindByName(kindName: string) {
    const kind = this.itemKinds[kindName];
    if (!kind) {
      throw new Error(`item kind ${kindName} does not exist`);
    }
    return kind;
  }

  insertFromDroppedItem(player: Player, droppedItem: DroppedItem) {
    const item = {
      amount: droppedItem.amount,
      playerId: player.id,
      kind: droppedItem.kind,
      bank: false,
    };
    this.db.create(itemType, item);
  }

  pickUp(player: Player, droppedItem: DroppedItem) {
    const inventory = this.findAllByPlayerInventory(player);
    const found = inventory.find((item) => item.kind === droppedItem.kind);
    const kind = this.droppedItemService.kind(droppedItem);
    if (found && kind.stackable) {
      // stack item
      found.amount += droppedItem.amount;
      this.db.update(found);
    } else {
      this.insertFromDroppedItem(player, droppedItem);
    }
    // this.messageService.postEventField(
    //   `${player.username} picks up ${droppedItem.amount} ${kind.label}.`,
    //   player.posX,
    //   player.posY
    // );
    this.droppedItemService.delete(droppedItem);
  }

  findAllByPlayerInventory(player: Player): Item[] {
    return this.db.findItemByPlayerInventory(player.id);
  }
}
