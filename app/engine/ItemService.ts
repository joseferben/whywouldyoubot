import type { DroppedItem, Item, ItemKindOpts, Player } from "~/engine/core";
import type { DroppedItemService } from "~/engine/DroppedItemService";
import type { JSONStore } from "./EntityDB/JSONStore";
import { EntityDB } from "./EntityDB/EntityDB";

export class ItemService {
  db!: EntityDB<Item>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly droppedItemService: DroppedItemService,
    readonly itemKinds: { [name: string]: ItemKindOpts }
  ) {
    this.db = EntityDB.builder<Item>()
      .withPersistor(jsonStore, "items")
      .build();
  }

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
    this.db.create(item);
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
    //   player.x,
    //   player.y
    // );
    this.droppedItemService.delete(droppedItem);
  }

  findAllByPlayerInventory(player: Player): Item[] {
    return this.db.findByFilter({ playerId: player.id, bank: false });
  }
}
