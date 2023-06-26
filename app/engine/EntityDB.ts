import { nanoid } from "nanoid";
import type { JSONDB } from "./JSONDB";

export type Migrator = {
  fromVersion: number;
  migrate: (entity: any) => any;
};

export type Opts<Entity> = {
  jsonDB?: JSONDB;
  persistIntervalMs?: number;
  persistAfterChangeCount?: number;
  migrators?: Migrator[];
  indices?: (keyof Entity)[];
};

const defaultOpts = {
  persistIntervalMs: 1000,
  persistAfterChangeCount: 10,
};

export class EntityDB<Entity extends { id: string }> {
  entities: Map<string, Entity> = new Map();
  // a set of entity ids that have changed an need to be persisted
  changed: Set<string> = new Set();
  // {"health": {"10": ["playerid_1", "playerid_2"], "20": ["playerid_3"]}"}}
  index: Map<string, Map<string, Set<string>>> = new Map();

  constructor(readonly opts: Opts<Entity>) {
    this.index = new Map();
    opts.indices?.forEach((key) => {
      this.index.set(key as string, new Map());
    });
    this.schedulePersist();
    this.loadEntities();
  }

  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  private loadEntities() {
    if (!this.opts.jsonDB) return;
    const jsons = this.opts.jsonDB.all();
    for (const json of jsons) {
      const entity = json as Entity;
      this.insert(entity);
    }
  }

  private schedulePersist() {
    if (!this.opts.jsonDB) return;
    setInterval(() => {
      this.persistChanged();
    }, this.opts.persistIntervalMs || defaultOpts.persistIntervalMs);
  }

  private addChanged(entity: Entity) {
    this.changed.add(entity.id);
    const hasChangedEnough =
      this.changed.size >
      (this.opts.persistAfterChangeCount !== undefined
        ? this.opts.persistAfterChangeCount
        : defaultOpts.persistAfterChangeCount);

    if (hasChangedEnough) {
      this.persistChanged();
    }
  }

  private persistChanged() {
    if (!this.opts.jsonDB) return;
    for (const id of this.changed) {
      const entity = this.entities.get(id);
      if (!entity) {
        this.opts.jsonDB.delete(id);
      } else {
        this.opts.jsonDB.set(entity.id, JSON.stringify(entity));
      }
      this.changed.delete(id);
    }
  }

  private updateIndex(entity: Entity) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key as keyof Entity])) || new Set();
      index.add(entity.id);
      value.set(String(entity[key as keyof Entity]), index);
    }
  }

  private deleteIndex(entity: Entity) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key as keyof Entity])) || new Set();
      index.delete(entity.id);
      value.set(String(entity[key as keyof Entity]), index);
    }
  }

  create(entity: Omit<Entity, "id">) {
    const id = nanoid();
    const toInsert = { id, ...entity } as Entity;
    this.insert(toInsert);
    return toInsert;
  }

  insert(entity: Entity) {
    this.entities.set(entity.id, entity);
    this.updateIndex(entity);
    this.addChanged(entity);
  }

  update(entity: Entity) {
    this.entities.set(entity.id, entity);
    this.updateIndex(entity);
    this.addChanged(entity);
  }

  delete(entity: Entity) {
    this.entities.delete(entity.id);
    this.deleteIndex(entity);
    this.addChanged(entity);
  }

  findById(id: string): Entity | null {
    return this.entities.get(id) ?? null;
  }

  findByIds(ids: Iterable<string>): Entity[] {
    const result: Entity[] = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (entity != null) {
        result.push(entity);
      }
    }
    return result;
  }

  findBy(key: keyof Entity, value: Entity[typeof key]): Entity[] {
    if (key === "id") {
      const entity = this.findById(value as string);
      return entity ? [entity] : [];
    }

    const index = this.index.get(key as string);
    if (!index) {
      throw new Error(`Index not found for key ${key as string}`);
    }
    const ids = index.get(String(value)) || new Set();
    const result: Entity[] = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (entity != null) {
        result.push(entity);
      }
    }
    return result;
  }

  findByFilter(filter: Partial<Entity>) {
    const ids: Set<string> = new Set();
    let first = true;
    for (const [key, value] of Object.entries(filter)) {
      if (key === "id") {
        const entity = this.findById(value as string);
        if (entity) {
          ids.add(entity.id);
          break;
        }
      }

      const index = this.index.get(key as string);
      if (!index) {
        throw new Error(`Index not found for key ${key as string}`);
      }
      const foundIds = index.get(String(value)) || new Set();
      if (first) {
        for (const id of foundIds) {
          ids.add(id);
        }
      } else {
        for (const id of ids) {
          if (!foundIds.has(id)) {
            ids.delete(id);
          }
        }
      }
      first = false;
    }
    return this.findByIds(ids);
  }
}
