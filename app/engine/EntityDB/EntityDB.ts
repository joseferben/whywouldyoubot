import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import { SpatialIndex } from "./SpatialIndex";
import { FieldIndex } from "./FieldIndex";
import { Migrations, Migrator } from "./Migrator";
import { Persistor } from "./Persistor";
import type { JSONStore } from "./JSONStore";

export type Opts = {
  fieldIndex?: FieldIndex;
  spatialIndex?: SpatialIndex;
  persistor?: Persistor;
  migrator?: Migrator;
};

class EntityDBBuilder<
  E extends { id: string; v?: number; x?: number; y?: number }
> {
  fieldIndex?: FieldIndex;
  spatialIndex?: SpatialIndex;
  persistor?: Persistor;
  migrator?: Migrator;

  withFieldIndex(fields: string[]) {
    this.fieldIndex = new FieldIndex(fields);
    return this;
  }

  withSpatialIndex() {
    this.spatialIndex = new SpatialIndex();
    return this;
  }

  withPersistor(
    jsonDB: JSONStore,
    namespace: string,
    persistIntervalMs?: number,
    persistAfterChangeCount?: number
  ) {
    this.persistor = new Persistor(
      jsonDB,
      namespace,
      persistIntervalMs,
      persistAfterChangeCount
    );
    return this;
  }

  withMigrator(migrations: Migrations) {
    this.migrator = new Migrator(migrations);
    return this;
  }

  build() {
    return new EntityDB<E>({
      fieldIndex: this.fieldIndex,
      spatialIndex: this.spatialIndex,
      persistor: this.persistor,
      migrator: this.migrator,
    });
  }
}

export class EntityDB<
  E extends { id: string; v?: number; x?: number; y?: number }
> {
  entities!: Map<string, E>;

  static builder<
    E extends { id: string; v?: number; x?: number; y?: number }
  >() {
    return new EntityDBBuilder<E>();
  }

  constructor(readonly opts: Opts = {}) {
    this.entities = new Map();
    this.opts.persistor?.setEntities(this.entities);
    this.opts.persistor?.loadEntities(this.loadEntity.bind(this));
    this.installShutdownHandlers();
  }

  private loadEntity(entity: E) {
    if (this.opts.migrator?.needsMigration(entity)) {
      this.opts.migrator.migrate(entity);
      // needs persisting
      this.insert(entity);
    } else {
      this.entities.set(entity.id, entity);
      this.opts.fieldIndex?.update(entity);
      this.opts.spatialIndex?.update(entity);
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
    const v = this.opts.migrator?.migratorTargetVersion || 0;
    const toInsert = { id, v, ...entity } as E;
    this.insert(toInsert);
    return toInsert;
  }

  insert(entity: E) {
    if (this.opts.migrator && this.opts.migrator.needsMigration(entity)) {
      this.opts.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.opts.fieldIndex?.update(entity);
    this.opts.spatialIndex?.update(entity);
    this.opts.persistor?.addChanged(entity);
  }

  update(entity: E) {
    if (this.opts.migrator?.needsMigration(entity)) {
      this.opts.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.opts.fieldIndex?.update(entity);
    this.opts.spatialIndex?.update(entity);
    this.opts.persistor?.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.opts.fieldIndex?.delete(entity);
    this.opts.spatialIndex?.delete(entity);
    this.opts.persistor?.addChanged(entity);
  }

  findAll(limit = 50): E[] {
    const result: E[] = [];
    for (const entity of this.entities.values()) {
      result.push(entity);
      if (result.length >= limit) {
        break;
      }
    }
    return result;
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
    if (!this.opts.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    if (key === "id") {
      const entity = this.findById(value as string);
      return entity ? [entity] : [];
    }
    const ids = Array.from(this.opts.fieldIndex.findBy(key as string, value));
    return this.findByIds(ids);
  }

  findOneBy(key: keyof E, value: E[typeof key]): E | null {
    const result = this.findBy(key, value);
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }

  findByFilter(filter: Partial<E>) {
    if (!this.opts.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    const ids = Array.from(this.opts.fieldIndex.findByFilter(filter));
    return this.findByIds(ids || []);
  }

  findOneByFilter(filter: Partial<E>) {
    const result = this.findByFilter(filter);
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }

  findByPosition(x: number, y: number): Iterable<E> {
    if (!this.opts.spatialIndex)
      throw new Error("SpatialIndex needed for findByPosition");
    const ids = this.opts.spatialIndex.findByPosition(x, y);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
      result.push(entity);
    }
    return result;
  }

  findByRectangle(x: number, y: number, width: number, height: number): E[] {
    if (!this.opts.spatialIndex)
      throw new Error("SpatialIndex needed for findByRectangle");

    const ids = this.opts.spatialIndex.findByRectangle(x, y, width, height);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
    }
    return result;
  }

  count(): number {
    return this.entities.size;
  }

  close() {
    console.log("shutdown gracefully, persisting entities");
    this.opts.persistor?.close();
  }
}
