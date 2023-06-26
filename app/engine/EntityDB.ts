import { nanoid } from "nanoid";
import type { JSONDB } from "./JSONDB";
import invariant from "tiny-invariant";

export type VersionedEntity = { id: string; v: number };

export class FieldIndex {
  index: Map<string, Map<string, Set<string>>> = new Map();

  constructor(readonly fields: string[]) {
    fields.forEach((field) => this.index.set(field, new Map()));
  }

  private updateIndex(entity: any) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key])) || new Set();
      index.add(entity.id);
      value.set(String(entity[key]), index);
    }
  }

  private deleteIndex(entity: any) {
    for (const [key, value] of this.index.entries()) {
      const index = value.get(String(entity[key])) || new Set();
      index.delete(entity.id);
      value.set(String(entity[key]), index);
    }
  }

  insert(entity: any) {
    this.updateIndex(entity);
  }

  update(entity: any) {
    this.updateIndex(entity);
  }

  delete(entity: any) {
    this.deleteIndex(entity);
  }

  findBy(key: string, value: any): Iterable<string> {
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

  findByFilter(filter: any): Iterable<string> {
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

export type Migrations = {
  [fromVersion: number]: (entity: any) => any;
};

export class Migrator {
  readonly migratorTargetVersion: number;

  constructor(readonly migrations: Migrations) {
    this.migratorTargetVersion = 0;
    if (migrations) {
      try {
        const versions = Object.keys(migrations).map((v) => parseInt(v));
        this.migratorTargetVersion = Math.max(...versions) + 1;
      } catch (e) {
        console.error(e);
        console.error("Migrators must be an object with integer keys");
      }
    }
  }

  needsMigration(entity: { v: number }) {
    return entity.v < this.migratorTargetVersion;
  }

  migrate<E extends { v: number; id: string }>(entity: E) {
    for (let i = entity.v; i < this.migratorTargetVersion; i++) {
      console.log(`Migrating ${entity.id} from ${i} to ${i + 1}`);
      const migrator = this.migrations?.[i];
      if (!migrator) {
        throw new Error(`No migrator for version ${i}`);
      }
      const id = entity.id;
      const migrated = migrator(entity);
      for (const key of Object.keys(entity)) {
        delete (entity as any)[key as string];
      }
      for (const [key, value] of Object.entries(migrated)) {
        (entity as any)[key] = value as E[];
      }
      entity.v = i + 1;
      entity.id = id;
    }
  }
}

export type Opts<Entity> = {
  jsonDB: JSONDB;
  persistIntervalMs?: number;
  persistAfterChangeCount?: number;
  migrators?: Migrations;
  indices?: (keyof Entity)[];
};

const defaultOpts = {
  persistIntervalMs: 1000,
  persistAfterChangeCount: 10,
};

export class Persistor<E extends VersionedEntity> {
  changed: Set<string> = new Set();
  timer: NodeJS.Timer | undefined;

  constructor(
    readonly entities: Map<string, E>,
    readonly jsonDB: JSONDB,
    readonly persistIntervalMs?: number,
    readonly persistAfterChangeCount?: number
  ) {
    this.schedulePersist();
  }

  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  loadEntities(fun?: (e: E) => void) {
    if (!this.jsonDB) return;
    const jsons = this.jsonDB.all<E>();
    for (const json of jsons) {
      invariant(json.id !== undefined, "Entity must have an id");
      invariant(json.v !== undefined, `Entity ${json.id} must have a version`);
      const entity = json as E;
      if (fun) fun(entity);
    }
  }

  schedulePersist() {
    if (!this.jsonDB) return;
    this.timer = setInterval(() => {
      this.persistChanged();
    }, this.persistIntervalMs || defaultOpts.persistIntervalMs);
  }

  addChanged(entity: E) {
    this.changed.add(entity.id);
    const hasChangedEnough =
      this.changed.size >
      (this.persistAfterChangeCount !== undefined
        ? this.persistAfterChangeCount
        : defaultOpts.persistAfterChangeCount);

    if (hasChangedEnough) {
      this.persistChanged();
    }
  }

  persistChanged() {
    if (!this.jsonDB) return;
    for (const id of this.changed) {
      const entity = this.entities.get(id);
      try {
        if (!entity) {
          this.jsonDB.delete(id);
        } else {
          this.jsonDB.set(entity.id, JSON.stringify(entity));
        }
      } catch (e) {
        console.error(e);
        console.error("Failed to persist changed", entity || id);
      }
      this.changed.delete(id);
    }
  }

  close() {
    this.timer && clearInterval(this.timer);
    this.persistChanged();
  }
}

export class EntityDB<E extends VersionedEntity> {
  entities: Map<string, E> = new Map();
  fieldIndex!: FieldIndex;
  migrator: Migrator | undefined;
  persistor!: Persistor<E>;

  constructor(readonly opts: Opts<E>) {
    this.fieldIndex = new FieldIndex(opts.indices as string[]);
    this.migrator = opts.migrators ? new Migrator(opts.migrators) : undefined;
    this.persistor = new Persistor(
      this.entities,
      opts.jsonDB,
      opts.persistIntervalMs,
      opts.persistAfterChangeCount
    );
    this.persistor.loadEntities(this.loadEntity.bind(this));
    this.installShutdownHandlers();
  }

  private loadEntity(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
      // needs persisting
      this.insert(entity);
    } else {
      this.entities.set(entity.id, entity);
      this.fieldIndex.update(entity);
    }
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

  create(entity: Omit<Omit<E, "id">, "v">): E {
    const id = nanoid();
    const v = this.migrator?.migratorTargetVersion || 0;
    const toInsert = { id, v, ...entity } as E;
    this.insert(toInsert);
    return toInsert;
  }

  insert(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex.update(entity);
    this.persistor.addChanged(entity);
  }

  update(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex.update(entity);
    this.persistor.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.fieldIndex.delete(entity);
    this.persistor.addChanged(entity);
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
    const ids = Array.from(this.fieldIndex.findBy(key as string, value));
    return this.findByIds(ids);
  }

  findByFilter(filter: Partial<E>) {
    const ids = Array.from(this.fieldIndex.findByFilter(filter));
    return this.findByIds(ids || []);
  }

  close() {
    console.log("shutdown gracefully, persisting entities");
    this.persistor.close();
    this.opts.jsonDB?.db.close();
  }
}
