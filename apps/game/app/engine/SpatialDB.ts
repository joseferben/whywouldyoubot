import invariant from "tiny-invariant";
import { FieldIndex } from "./EntityDB";
import { nanoid } from "nanoid";

export type SpatialEntity = {
  id: string;
  x: number;
  y: number;
};

export class SpatialDB<E extends SpatialEntity & { id: string }> {
  entities: Map<string, E>;
  spatialIndex!: SpatialIndex;
  fieldIndex!: FieldIndex;

  constructor(readonly fields: string[]) {
    this.fieldIndex = new FieldIndex(fields);
    this.spatialIndex = new SpatialIndex();
    this.entities = new Map();
  }

  findById(id: string): E | null {
    return this.entities.get(id) || null;
  }

  findAll(): Iterable<E> {
    return this.entities.values();
  }

  findByPosition(x: number, y: number): Iterable<E> {
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
    const ids = this.spatialIndex.findByRectangle(x, y, width, height);
    const result: E[] = [];
    for (const id of ids) {
      const entity = this.entities.get(id);
      invariant(entity, `Entity ${id} not found`);
    }
    return result;
  }

  create(entity: Omit<E, "id">): void {
    const toInsert = { ...entity, id: nanoid() } as E;
    this.spatialIndex.insert(toInsert);
    this.fieldIndex.insert(toInsert);
    this.entities.set(toInsert.id, toInsert);
  }

  update(entity: E): void {
    this.spatialIndex.update(entity);
    this.fieldIndex.update(entity);
  }

  insert(entity: E): void {
    this.spatialIndex.insert(entity);
    this.fieldIndex.insert(entity);
    this.entities.set(entity.id, entity);
  }

  delete(entity: E): void {
    this.spatialIndex.delete(entity);
    this.fieldIndex.delete(entity);
    this.entities.delete(entity.id);
  }
}
