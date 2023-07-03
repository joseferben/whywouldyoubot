import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import { SpatialIndex } from "./SpatialIndex";
import { FieldIndex } from "./FieldIndex";
import type { Migrations } from "./Migrator";
import { Migrator } from "./Migrator";
import { Persistor } from "./Persistor";
import type { JSONStore } from "./JSONStore";
import { Evictor } from "./Evictor";

export type Opts<Entity> = {
  fields?: string[];
  spatial?: boolean;
  jsonStore?: JSONStore;
  persistenceNamespace?: string;
  persistenceIntervalMs?: number;
  persistenceAfterChangeCount?: number;
  migrations?: Migrations;
  evictorListener?: (entity: Entity) => void;
};

export class EntityDB<
  E extends { id: string; v?: number; x?: number; y?: number }
> {
  entities!: Map<string, E>;
  persistor!: Persistor;
  fieldIndex!: FieldIndex;
  spatialIndex!: SpatialIndex;
  migrator!: Migrator;
  evictor!: Evictor<E>;

  constructor(readonly opts: Opts<E> = {}) {
    this.entities = new Map();
    if (opts.jsonStore && opts.persistenceNamespace) {
      this.persistor = new Persistor(
        opts.jsonStore,
        opts.persistenceNamespace,
        opts.persistenceIntervalMs,
        opts.persistenceAfterChangeCount
      );
    } else if (opts.jsonStore && !opts.persistenceNamespace) {
      throw new Error(
        "persistenceNamespace must be provided if using jsonStore"
      );
    }
    if (opts.fields) {
      this.fieldIndex = new FieldIndex(opts.fields);
    }
    if (opts.spatial) {
      this.spatialIndex = new SpatialIndex();
    }
    if (opts.migrations) {
      this.migrator = new Migrator(opts.migrations);
    }
    this.evictor = new Evictor<E>(this.handleExpire.bind(this));
    this.persistor?.setEntities(this.entities);
    this.persistor?.loadEntities(this.loadEntity.bind(this));
    this.installShutdownHandlers();
  }

  private handleExpire(entity: E) {
    this.delete(entity);
    this.opts.evictorListener?.(entity);
  }

  private loadEntity(entity: E) {
    if (this.migrator?.needsMigration(entity)) {
      this.migrator.migrate(entity);
      // needs persisting
      this.insert(entity);
    } else {
      this.entities.set(entity.id, entity);
      this.fieldIndex?.update(entity);
      this.spatialIndex?.update(entity);
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

  create(entity: Omit<Omit<E, "id">, "v">, opts?: { ttlMs?: number }): E {
    const id = nanoid();
    const v = this.migrator?.migratorTargetVersion || 0;
    const toInsert = { id, v, ...entity } as E;
    this.insert(toInsert);
    if (opts?.ttlMs) {
      this.evictor.expire(toInsert, opts.ttlMs);
    }
    return toInsert;
  }

  insert(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex?.update(entity);
    this.spatialIndex?.update(entity);
    this.persistor?.addChanged(entity);
  }

  update(entity: E) {
    if (this.migrator?.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex?.update(entity);
    this.spatialIndex?.update(entity);
    this.persistor?.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.fieldIndex?.delete(entity);
    this.spatialIndex?.delete(entity);
    this.persistor?.addChanged(entity);
  }

  findAll(limit?: number): E[] {
    const result: E[] = [];
    for (const entity of this.entities.values()) {
      result.push(entity);
      if (limit && result.length >= limit) {
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
    if (!this.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    if (key === "id") {
      const entity = this.findById(value as string);
      return entity ? [entity] : [];
    }
    const ids = Array.from(this.fieldIndex.findBy(key as string, value));
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
    if (!this.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    const ids = Array.from(this.fieldIndex.findByFilter(filter));
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
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByPosition");
    const ids = this.spatialIndex.findByPosition(x, y);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
      result.push(entity);
    }
    return result;
  }

  findOneByPosition(x: number, y: number): E | null {
    const result = Array.from(this.findByPosition(x, y));
    if (result.length > 1) {
      throw new Error(`Expected 1 result, got ${result.length}`);
    }
    return result[0] ?? null;
  }

  findByRectangle(x: number, y: number, width: number, height: number): E[] {
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByRectangle");

    const ids = this.spatialIndex.findByRectangle(x, y, width, height);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
      result.push(entity);
    }
    return result;
  }

  count(): number {
    return this.entities.size;
  }

  expire(entity: E, ttlMs?: number) {
    this.evictor?.expire(entity, ttlMs);
  }

  close() {
    this.persistor?.close();
  }
}
