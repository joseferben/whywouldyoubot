import { Entity, Schema } from "redis-om";
import { getItemKind } from "~/content/content";
import { redis } from "~/engine/db.server";
import { ItemKind } from "~/engine/item";
import { Rectangle } from "~/utils";

export interface Item {
  entityId: string;
  name: string;
  x: number | null;
  y: number | null;
  user: string | null;
}

export class Item extends Entity {
  kind(): ItemKind {
    const kind = getItemKind(this.name);
    if (!kind) {
      throw new Error(`item kind ${kind} does not exist`);
    }
    return kind;
  }
}

const itemSchema = new Schema(
  Item,
  {
    name: { type: "string", indexed: true },
    x: { type: "number", indexed: true },
    y: { type: "number", indexed: true },
    user: { type: "string", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export const itemRepository = redis.fetchRepository(itemSchema);

export async function spawnItem(x: number, y: number, itemKind: ItemKind) {
  return itemRepository.createAndSave({
    name: itemKind.name,
    x,
    y,
  });
}

export async function getItemsByPos(x: number, y: number) {
  return itemRepository
    .search()
    .where("x")
    .equals(Math.round(x))
    .and("y")
    .equals(Math.round(y))
    .returnAll();
}

export async function getItemsByRect(rect: Rectangle, kind?: ItemKind) {
  const { x, y, width, height } = rect;
  const xMin = x;
  const xMax = x + width;
  const yMin = y;
  const yMax = y + height;
  const query = itemRepository
    .search()
    .where("x")
    .greaterThanOrEqualTo(xMin)
    .and("x")
    .lessThanOrEqualTo(xMax)
    .and("y")
    .greaterThanOrEqualTo(yMin)
    .and("y")
    .lessThanOrEqualTo(yMax);
  return kind
    ? query.where("name").equal(kind.name).returnAll()
    : query.returnAll();
}
