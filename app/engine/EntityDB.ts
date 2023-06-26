import { nanoid } from "nanoid";
import type { JSONDB } from "./JSONDB";
import invariant from "tiny-invariant";

export type VersionedEntity = { id: string; v: number };

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

export class FieldIndex<E extends { id: string }> {
  index: Map<string, Map<string, Set<string>>> = new Map();

  constructor(readonly fields: string[]) {
    fields.forEach((field) => this.index.set(field, new Map()));
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

  insert(entity: E) {
    this.updateIndex(entity);
  }

  update(entity: E) {
    this.updateIndex(entity);
  }

  delete(entity: E) {
    this.deleteIndex(entity);
  }

  findBy(key: keyof E, value: E[typeof key]): Iterable<string> {
    const index = this.index.get(key as string);
    if (!index) {
      throw new Error(`Index not found for key ${key as string}`);
    }
    const ids = index.get(String(value)) || new Set();
    const result: string[] = [];
    for (const id of ids) {
      result.push(id);
    }
    return result;
  }

  findByFilter(filter: Partial<E>): Iterable<string> {
    let ids: Set<string> | undefined;
    for (const [key, value] of Object.entries(filter)) {
      if (key === "id") {
        return [value as string];
      }

      const index = this.index.get(key as string);
      if (!index) {
        throw new Error(`Index not found for key ${key as string}`);
      }
      const foundIds = index.get(String(value)) || new Set();

      if (!ids) {
        ids = new Set(foundIds);
      } else {
        ids = new Set([...ids].filter((id) => foundIds.has(id)));
      }
    }
    return ids ?? [];
  }
}

// migrations
// optional persistence
// field indices
export class EntityDB<E extends VersionedEntity> {
  entities: Map<string, E> = new Map();
  // a set of entity ids that have changed an need to be persisted
  changed: Set<string> = new Set();
  fieldIndex!: FieldIndex<E>;
  timer: NodeJS.Timer | undefined;
  migratorTargetVersion: number;

  constructor(readonly opts: Opts<E>) {
    this.fieldIndex = new FieldIndex((opts.indices ?? []) as string[]);
    this.migratorTargetVersion = 0;
    if (opts.migrators) {
      try {
        const versions = Object.keys(opts.migrators).map((v) => parseInt(v));
        this.migratorTargetVersion = Math.max(...versions) + 1;
      } catch (e) {
        console.error(e);
        console.error("Migrators must be an object with integer keys");
      }
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
    const jsons = this.opts.jsonDB.all<E>();
    for (const json of jsons) {
      invariant(json.id !== undefined, "Entity must have an id");
      invariant(json.v !== undefined, `Entity ${json.id} must have a version`);
      const entity = json as E;
      if (this.needsMigration(entity)) {
        this.migrate(entity);
        // needs persisting
        this.insert(entity);
      } else {
        this.entities.set(entity.id, entity);
        this.fieldIndex.update(entity);
      }
    }
  }

  private needsMigration(entity: E) {
    return entity.v < this.migratorTargetVersion;
  }

  private migrate(entity: E) {
    for (let i = entity.v; i < this.migratorTargetVersion; i++) {
      console.log(`Migrating ${entity.id} from ${i} to ${i + 1}`);
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
      }
      entity.v = i + 1;
      entity.id = id;
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
      try {
        if (!entity) {
          this.opts.jsonDB.delete(id);
        } else {
          this.opts.jsonDB.set(entity.id, JSON.stringify(entity));
        }
      } catch (e) {
        console.error(e);
        console.error("Failed to persist changed", entity || id);
      }
      this.changed.delete(id);
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
    this.fieldIndex.update(entity);
    this.addChanged(entity);
  }

  update(entity: E) {
    if (this.needsMigration(entity)) {
      this.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex.update(entity);
    this.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.fieldIndex.delete(entity);
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
    const ids = Array.from(this.fieldIndex.findBy(key, value));
    return this.findByIds(ids);
  }

  findByFilter(filter: Partial<E>) {
    const ids = Array.from(this.fieldIndex.findByFilter(filter));
    return this.findByIds(ids || []);
  }

  close() {
    console.log("shutdown gracefully, persisting entities");
    this.timer && clearInterval(this.timer);
    this.persistChanged();
    this.opts.jsonDB?.db.close();
  }
}
