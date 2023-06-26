import invariant from "tiny-invariant";

export type SpatialEntity = {
  x: number;
  y: number;
};

// spatial indices
// field indices
export class SpatialIndex<E extends SpatialEntity> {
  map: { [x: number]: { [y: number]: E } };

  constructor() {
    this.map = {};
  }

  findById(id: string): E | null {
    return this.entities[id] || null;
  }

  findByPosition(x: number, y: number): E[] {
    const ids = this.map[x]?.[y] || [];
    return ids.map((id) => this.findById(id)).filter((e) => e != null) as E[];
  }

  findByRectangle(x: number, y: number, width: number, height: number): E[] {
    const entities: E[] = [];
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        entities.push(...this.findByPosition(i, j));
      }
    }
    return entities;
  }

  insert(entity: E, x: number, y: number): void {
    this.map[x] = this.map[x] || {};
    this.map[x][y] = this.map[x][y] || [];
    this.entities[entity.id] = entity;
  }

  bulkInsert(
    entities: {
      entity: E;
      x: number;
      y: number;
    }[]
  ): void {
    for (const { entity, x, y } of entities) {
      this.map[x] = this.map[x] || {};
      this.map[x][y] = this.map[x][y] || [];
      this.entities[entity.id] = entity;
    }
  }

  update(id: string, update: (entity: E) => void): void {
    const entity = this.findById(id);
    if (entity) {
      update(entity);
    }
  }

  move(id: string, x: number, y: number): void {
    const entity = this.findById(id);
    invariant(entity, `Entity ${id} not found`);
    this.map[x] = this.map[x] || {};
    this.map[x][y] = this.map[x][y] || [];
    this.map[x][y].push(id);
  }

  delete(id: string): void {
    const { x, y } = this.entities[id];
    delete this.entities[id];
    delete this.map[x][y];
  }
}

export class SpatialEntityDB<E extends SpatialEntity> {
  spatialIndex: SpatialIndex<E> = new SpatialIndex();
  entityIndex: EntityIndex<E> = new EntityIndex();
}
