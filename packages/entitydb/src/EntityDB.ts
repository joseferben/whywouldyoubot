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
  namespace: string;
  fields?: string[];
  spatial?: boolean;
  jsonStore?: JSONStore;
  persistenceIntervalMs?: number;
  persistenceAfterChangeCount?: number;
  migrations?: Migrations;
  evictorListener?: (entity: Entity) => void;
};

const usedNamespaces = new Set<string>();

export class EntityDB<
  E extends { id: string; v?: number; x?: number; y?: number }
> {
  entities!: Map<string, E>;
  persistor!: Persistor;
  fieldIndex!: FieldIndex;
  spatialIndex!: SpatialIndex;
  migrator!: Migrator;
  evictor!: Evictor<E>;

  constructor(readonly opts: Opts<E>) {
    this.entities = new Map();
    if (opts.namespace === "") {
      throw new Error("EntityDB namespace cannot be empty");
    }
    if (usedNamespaces.has(opts.namespace)) {
      throw new Error(`EntityDB namespace ${opts.namespace} already in use`);
    }
    usedNamespaces.add(opts.namespace);

    if (opts.jsonStore) {
      this.persistor = new Persistor(
        opts.jsonStore,
        opts.namespace,
        opts.persistenceIntervalMs,
        opts.persistenceAfterChangeCount
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
    console.log("expire", entity.id);
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
    if (typeof process === "undefined") return;
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

  fromArray(entities: E[]) {
    entities.forEach((e) => this.insert(e));
    return this;
  }

  create(entity: Omit<Omit<E, "id">, "v">, opts?: { ttlMs?: number }): E {
    const id = `${this.opts.namespace}_${nanoid()}`;
    const v = this.migrator?.migratorTargetVersion || 0;
    const toInsert = { id, v, ...entity } as E;
    this.insert(toInsert);
    if (opts?.ttlMs) {
      this.evictor.expire(toInsert, opts.ttlMs);
    }
    return toInsert;
  }

  insert(entity: E, opts?: { ttlMs?: number }) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex?.update(entity);
    this.spatialIndex?.update(entity);
    this.persistor?.addChanged(entity);
    if (opts?.ttlMs) {
      this.evictor.expire(entity, opts.ttlMs);
    }
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

  deleteById(id: string) {
    const entity = this.entities.get(id);
    if (entity) {
      this.delete(entity);
    }
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

  getById(id: string): E {
    const entity = this.findById(id);
    invariant(entity != null, `Entity with id ${id} not found`);
    return entity;
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

  /**
   * Like findByIds but throws if any of the ids are not found
   */
  getByIds(ids: Iterable<string>): E[] {
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.findById(id);
      if (!entity)
        throw new Error(
          `Entity with id ${id} not found, field index is out of sync`
        );
      result.push(entity);
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
    return this.getByIds(ids);
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
      invariant(entity, `Entity ${id} not found, spatial index is out of sync`);
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

  findByRectangle(x1: number, y1: number, x2: number, y2: number): E[] {
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByRectangle");

    const ids = this.spatialIndex.findByRectangle(x1, y1, x2, y2);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found, spatial index is out of sync`);
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
    this.entities = new Map();
  }

  /**
   * Empties the store. This is only used for testing.
   */
  clean() {
    if (process.env.NODE_ENV === "production") {
      console.warn("clean() should only be used for testing");
      return;
    }
    this.entities = new Map();
    this.spatialIndex?.clean();
    this.fieldIndex?.clean();
    this.persistor?.clean();
  }
}
