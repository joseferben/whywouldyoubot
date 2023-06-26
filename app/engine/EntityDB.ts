import { nanoid } from "nanoid";
import type { JSONDB } from "./JSONDB";

export type Entity = { id: string; v: number };

export type Migrators = {
  [fromVersion: number]: (entity: any) => any;
};

export type Opts<Entity> = {
  jsonDB?: JSONDB;
  persistIntervalMs?: number;
  persistAfterChangeCount?: number;
  migrators?: Migrators;
  indices?: (keyof Entity)[];
};

const defaultOpts = {
  persistIntervalMs: 1000,
  persistAfterChangeCount: 10,
};

export class EntityDB<E extends Entity> {
  entities: Map<string, E> = new Map();
  // a set of entity ids that have changed an need to be persisted
  changed: Set<string> = new Set();
  // {"health": {"10": ["playerid_1", "playerid_2"], "20": ["playerid_3"]}"}}
  index: Map<string, Map<string, Set<string>>> = new Map();
  timer: NodeJS.Timer | undefined;
  migratorTargetVersion: number;

  constructor(readonly opts: Opts<E>) {
    this.index = new Map();
    opts.indices?.forEach((key) => {
      this.index.set(key as string, new Map());
    });
    this.migratorTargetVersion = 0;
    if (opts.migrators) {
      const versions = Object.keys(opts.migrators).map((v) => parseInt(v));
      this.migratorTargetVersion = Math.max(...versions) + 1;
    }
    this.schedulePersist();
    this.loadEntities();
    this.installShutdownHandlers();
  }

  private installShutdownHandlers() {
    process.on("SIGINT", () => {
      this.close();
    });
    process.on("SIGTERM", () => {
      this.close();
    });
    process.on("exit", () => {
      this.close();
    });
  }

  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  private loadEntities() {
    if (!this.opts.jsonDB) return;
    const jsons = this.opts.jsonDB.all();
    for (const json of jsons) {
      const entity = json as E;
      if (this.needsMigration(entity)) {
        this.migrate(entity);
        // needs persisting
        this.insert(entity);
      } else {
        this.entities.set(entity.id, entity);
        this.updateIndex(entity);
      }
    }
  }

  private needsMigration(entity: E) {
    return entity.v < this.migratorTargetVersion;
  }

  private migrate(entity: E) {
    for (let i = entity.v; i < this.migratorTargetVersion; i++) {
      const migrator = this.opts.migrators?.[i];
      if (!migrator) {
        throw new Error(`No migrator for version ${i}`);
      }
      const id = entity.id;
      const migrated = migrator(entity);
      for (const key of Object.keys(entity)) {
        delete entity[key as keyof E];
      }
      for (const [key, value] of Object.entries(migrated)) {
        entity[key as keyof E] = value as E[keyof E];
        entity.v = i + 1;
        entity.id = id;
      }
    }
  }

  private schedulePersist() {
    if (!this.opts.jsonDB) return;
    this.timer = setInterval(() => {
      this.persistChanged();
    }, this.opts.persistIntervalMs || defaultOpts.persistIntervalMs);
  }

  private addChanged(entity: E) {
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

  private updateIndex(entity: E) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key as keyof E])) || new Set();
      index.add(entity.id);
      value.set(String(entity[key as keyof E]), index);
    }
  }

  private deleteIndex(entity: E) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key as keyof E])) || new Set();
      index.delete(entity.id);
      value.set(String(entity[key as keyof E]), index);
    }
  }

  create(entity: Omit<Omit<E, "id">, "v">): E {
    const id = nanoid();
    const v = this.migratorTargetVersion;
    const toInsert = { id, v, ...entity } as E;
    this.insert(toInsert);
    return toInsert;
  }

  insert(entity: E) {
    if (this.needsMigration(entity)) {
      this.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.updateIndex(entity);
    this.addChanged(entity);
  }

  update(entity: E) {
    if (this.needsMigration(entity)) {
      this.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.updateIndex(entity);
    this.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.deleteIndex(entity);
    this.addChanged(entity);
  }

  findById(id: string): E | null {
    return this.entities.get(id) ?? null;
  }

  findByIds(ids: Iterable<string>): E[] {
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (entity != null) {
        result.push(entity);
      }
    }
    return result;
  }

  findBy(key: keyof E, value: E[typeof key]): E[] {
    if (key === "id") {
      const entity = this.findById(value as string);
      return entity ? [entity] : [];
    }

    const index = this.index.get(key as string);
    if (!index) {
      throw new Error(`Index not found for key ${key as string}`);
    }
    const ids = index.get(String(value)) || new Set();
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (entity != null) {
        result.push(entity);
      }
    }
    return result;
  }

  findByFilter(filter: Partial<E>) {
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

  close() {
    console.log("shutdown gracefully, persisting entities");
    this.timer && clearInterval(this.timer);
    this.persistChanged();
    this.opts.jsonDB?.db.close();
  }
}
