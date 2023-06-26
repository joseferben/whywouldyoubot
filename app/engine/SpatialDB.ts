import type { SpatialEntity } from "./core";
import invariant from "tiny-invariant";

export class SpatialDB<T extends SpatialEntity> {
  map: { [x: number]: { [y: number]: string[] } };
  entities: {
    [id: string]: T;
  };

  constructor() {
    this.map = {};
    this.entities = {};
  }

  findById(id: string): T | null {
    return this.entities[id] || null;
  }

  findByPosition(x: number, y: number): T[] {
    const ids = this.map[x]?.[y] || [];
    return ids.map((id) => this.findById(id)).filter((e) => e != null) as T[];
  }

  findByRectangle(x: number, y: number, width: number, height: number): T[] {
    const entities: T[] = [];
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        entities.push(...this.findByPosition(i, j));
      }
    }
    return entities;
  }

  insert(entity: T, x: number, y: number): void {
    this.map[x] = this.map[x] || {};
    this.map[x][y] = this.map[x][y] || [];
    this.entities[entity.id] = entity;
  }

  bulkInsert(
    entities: {
      entity: T;
      x: number;
      y: number;
    }[]
  ): void {
    for (const { entity, x, y } of entities) {
      this.map[x] = this.map[x] || {};
      this.map[x][y] = this.map[x][y] || [];
      this.entities[entity.id] = entity;
    }
  }

  update(id: string, update: (entity: T) => void): void {
    const entity = this.findById(id);
    if (entity) {
      update(entity);
    }
  }

  move(id: string, x: number, y: number): void {
    const entity = this.findById(id);
    invariant(entity, `Entity ${id} not found`);
    this.map[x] = this.map[x] || {};
    this.map[x][y] = this.map[x][y] || [];
    this.map[x][y].push(id);
  }

  delete(id: string): void {
    const { x, y } = this.entities[id];
    delete this.entities[id];
    delete this.map[x][y];
  }
}
