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
