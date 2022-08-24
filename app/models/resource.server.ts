import { Entity, Schema } from "redis-om";
import { getResourceKind } from "~/content/content";
import { redis } from "~/engine/db.server";
import { ResourceKind } from "~/engine/resource";
import { Rectangle } from "~/utils";

export interface Resource {
  entityId: string;
  name: string;
  maxAmount: number;
  amount: number;
  x: number;
  y: number;
}

export class Resource extends Entity {
  kind(): ResourceKind {
    const kind = getResourceKind(this.name);
    if (!kind) {
      throw new Error(`resource kind ${kind} does not exist`);
    }
    return kind;
  }
}

const resourceSchema = new Schema(
  Resource,
  {
    name: { type: "string", indexed: true },
    maxAmount: { type: "number" },
    amount: { type: "number" },
    x: { type: "number", indexed: true },
    y: { type: "number", indexed: true },
  },
  {
    dataStructure: "HASH",
  }
);

export const resourceRepository = redis.fetchRepository(resourceSchema);

export async function getResource(id: string) {
  return resourceRepository.fetch(id);
}

export async function spawnResource(
  x: number,
  y: number,
  resourceKind: ResourceKind
) {
  return resourceRepository.createAndSave({
    name: resourceKind.name,
    maxAmount: resourceKind.amount,
    amount: resourceKind.amount,
    x,
    y,
  });
}

export async function getResourceByPos(x: number, y: number) {
  return resourceRepository
    .search()
    .where("x")
    .equals(Math.round(x))
    .and("y")
    .equals(Math.round(y))
    .returnFirst();
}

export async function getResourcesByRect(rec: Rectangle, kind?: ResourceKind) {
  const { x, y, width, height } = rec;
  const xMin = x;
  const xMax = x + width;
  const yMin = y;
  const yMax = y + height;
  const query = resourceRepository
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
