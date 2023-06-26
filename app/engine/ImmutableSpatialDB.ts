import type { Draft } from "immer";
import { produce, immerable } from "immer";
import type { SpatialEntity } from "./core";
import invariant from "tiny-invariant";

export class ImmutableSpatialDB<T extends SpatialEntity> {
  [immerable] = true;
  readonly map: { readonly [x: number]: { readonly [y: number]: string[] } };
  readonly entities: {
    readonly [id: string]: T;
  };

  // TODO make private and add static methods to create
  constructor() {
    this.map = {};
    this.entities = {};
  }

  findById(id: string): T | null {
    return this.entities[id];
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

  insert(entity: T, x: number, y: number): ImmutableSpatialDB<T> {
    return produce(this, (draft) => {
      draft.map[x] = draft.map[x] || {};
      draft.map[x][y] = draft.map[x][y] || [];
      draft.entities[entity.id] = entity as Draft<T>;
    });
  }

  bulkInsert(
    entities: {
      entity: T;
      x: number;
      y: number;
    }[]
  ): ImmutableSpatialDB<T> {
    return produce(this, (draft) => {
      for (const { entity, x, y } of entities) {
        draft.map[x] = draft.map[x] || {};
        draft.map[x][y] = draft.map[x][y] || [];
        draft.entities[entity.id] = entity as Draft<T>;
      }
    });
  }

  update(
    id: string,
    update: (entity: Draft<T>) => void
  ): ImmutableSpatialDB<T> {
    return produce(this, (draft: Draft<ImmutableSpatialDB<T>>) => {
      const entity = draft.findById(id);
      if (entity) {
        update(entity as Draft<T>);
      }
    });
  }

  move(id: string, x: number, y: number): ImmutableSpatialDB<T> {
    return produce(this, (draft) => {
      const entity = this.findById(id);
      invariant(entity, `Entity ${id} not found`);
      delete draft.map[x][y];
      draft.map[x] = draft.map[x] || {};
      draft.map[x][y] = draft.map[x][y] || [];
      draft.map[x][y].push(id);
    });
  }

  delete(id: string): ImmutableSpatialDB<T> {
    return produce(this, (draft) => {
      const { x, y } = this.entities[id];
      delete draft.entities[id];
      delete draft.map[x][y];
    });
  }
}
