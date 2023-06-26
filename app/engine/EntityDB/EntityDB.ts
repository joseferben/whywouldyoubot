import { nanoid } from "nanoid";
import invariant from "tiny-invariant";
import type { SpatialIndex } from "./SpatialIndex";
import type { FieldIndex } from "./FieldIndex";
import type { Migrator } from "./Migrator";
import type { Persistor } from "./Persistor";

export type Opts = {
  fieldIndex?: FieldIndex;
  spatialIndex?: SpatialIndex;
  persistor?: Persistor;
  migrator?: Migrator;
};

export class EntityDB<
  E extends { id: string; v?: number; x?: number; y?: number }
> {
  entities!: Map<string, E>;
  fieldIndex: FieldIndex | undefined;
  spatialIndex: SpatialIndex | undefined;
  migrator: Migrator | undefined;
  persistor: Persistor | undefined;

  constructor(readonly opts: Opts = {}) {
    this.entities = new Map();
    this.fieldIndex = opts.fieldIndex;
    this.spatialIndex = opts.spatialIndex;
    this.migrator = opts.migrator;
    this.persistor = opts.persistor;
    this.persistor?.setEntities(this.entities);
    if (this.persistor) this.persistor.loadEntities(this.loadEntity.bind(this));
    this.installShutdownHandlers();
  }

  private loadEntity(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
      // needs persisting
      this.insert(entity);
    } else {
      this.entities.set(entity.id, entity);
      this.fieldIndex && this.fieldIndex.update(entity);
      this.spatialIndex && this.spatialIndex.update(entity);
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
    this.fieldIndex && this.fieldIndex.update(entity);
    this.spatialIndex && this.spatialIndex.update(entity);
    this.persistor && this.persistor.addChanged(entity);
  }

  update(entity: E) {
    if (this.migrator && this.migrator.needsMigration(entity)) {
      this.migrator.migrate(entity);
    }
    this.entities.set(entity.id, entity);
    this.fieldIndex && this.fieldIndex.update(entity);
    this.spatialIndex && this.spatialIndex.update(entity);
    this.persistor && this.persistor.addChanged(entity);
  }

  delete(entity: E) {
    this.entities.delete(entity.id);
    this.fieldIndex && this.fieldIndex.delete(entity);
    this.spatialIndex && this.spatialIndex.delete(entity);
    this.persistor && this.persistor.addChanged(entity);
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

  findByFilter(filter: Partial<E>) {
    if (!this.fieldIndex)
      throw new Error("Field index needed for findByFilter");
    const ids = Array.from(this.fieldIndex.findByFilter(filter));
    return this.findByIds(ids || []);
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

  findByRectangle(x: number, y: number, width: number, height: number): E[] {
    if (!this.spatialIndex)
      throw new Error("SpatialIndex needed for findByRectangle");

    const ids = this.spatialIndex.findByRectangle(x, y, width, height);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
    }
    return result;
  }

  close() {
    console.log("shutdown gracefully, persisting entities");
    this.persistor && this.persistor.close();
  }
}
