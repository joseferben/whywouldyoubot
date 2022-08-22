import { Entity, Schema } from "redis-om";
import * as resoureceKinds from "~/content/resource";

import { redis } from "~/engine/db.server";
import { ResourceKind, ResourceKindMap } from "~/engine/resource";
import { Rectangle } from "~/utils";

export interface Resource {
  entityId: string;
  name: string;
  amount: number;
  maxAmount: number;
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}

export function getResourceKindMap(): ResourceKindMap {
  return resoureceKinds;
}

export class Resource extends Entity {
  kind(): ResourceKind {
    return getResourceKindMap()[this.name];
  }
}

const resourceSchema = new Schema(
  Resource,
  {
    name: { type: "string", indexed: true },
    amount: { type: "number" },
    maxAmount: { type: "number" },
    x: { type: "number", indexed: true },
    y: { type: "number", indexed: true },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  {
    dataStructure: "HASH",
  }
);

export const resourceRepository = redis.fetchRepository(resourceSchema);

export function getResource(id: Resource["entityId"]) {
  return resourceRepository.fetch(id);
}

export function getResourceByPos(posX: number, posY: number) {
  return resourceRepository
    .search()
    .where("x")
    .equals(Math.round(posX))
    .and("y")
    .equals(Math.round(posY))
    .returnFirst();
}

export function getResourcesByRect(rec: Rectangle, kind?: ResourceKind) {
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
