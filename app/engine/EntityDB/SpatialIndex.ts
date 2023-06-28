export class SpatialIndex {
  index: { [x: number]: { [y: number]: Set<string> } };
  maxX: number = 0;
  maxY: number = 0;

  constructor() {
    this.index = {};
  }

  findByPosition(x: number, y: number): Iterable<string> {
    return this.index[x]?.[y] || [];
  }

  findByRectangle(
    x: number,
    y: number,
    width: number,
    height: number
  ): string[] {
    const ids: string[] = [];
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        ids.push(...this.findByPosition(i, j));
      }
    }
    return ids;
  }

  update(entity: { id: string; x?: number; y?: number }): void {
    if (entity.x === undefined || entity.y === undefined) {
      throw new Error("Can not use spatial index without x or y");
    }
    this.delete(entity);
    this.insert(entity);
  }

  insert(entity: { id: string; x?: number; y?: number }): void {
    if (entity.x === undefined || entity.y === undefined) {
      throw new Error("Can not use spatial index without x or y");
    }
    if (entity.x > this.maxX) {
      this.maxX = entity.x;
    }
    if (entity.y > this.maxY) {
      this.maxY = entity.y;
    }
    const { id, x, y } = entity;
    this.index[x] = this.index[x] || {};
    this.index[x][y] = this.index[x][y] || new Set();
    this.index[x][y].add(id);
  }

  bulkInsert(
    entities: {
      id: string;
      x: number;
      y: number;
    }[]
  ): void {
    for (const entity of entities) {
      this.insert(entity);
    }
  }

  delete(entity: { id: string; x?: number; y?: number }): void {
    if (entity.x === undefined || entity.y === undefined) {
      throw new Error("Can not use spatial index without x or y");
    }
    const { id, x, y } = entity;
    if (this.index[x]?.[y]?.has(id)) {
      this.index[x][y]?.delete(id);
    }
  }
}
