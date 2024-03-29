import type { JSONStore } from "./JSONStore";

export class Persistor {
  defaultOpts = {
    // persist every second
    persistIntervalMs: 1000,
    // persist every change by default
    persistAfterChangeCount: 0,
  };
  changed: Set<string> = new Set();
  timer: NodeJS.Timer | undefined;
  entities: Map<string, { v?: number; id: string }> | undefined;

  constructor(
    readonly jsonDB: JSONStore,
    readonly namespace: string,
    readonly persistIntervalMs?: number,
    readonly persistAfterChangeCount?: number
  ) {}

  setEntities(entities: Map<string, { v?: number; id: string }>) {
    this.entities = entities;
    this.schedulePersist();
  }
  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  loadEntities(fun?: (e: any) => void) {
    const jsons = this.jsonDB.all(this.namespace) as {
      id: string;
      v?: number;
    }[];
    for (const json of jsons) {
      if (json.id === null || json.id === undefined)
        throw new Error("Entity must have an id");
      if (json.v === undefined) {
        json.v = 0;
      }
      const entity = json;
      if (fun) fun(entity);
    }
  }

  schedulePersist() {
    this.timer = setInterval(() => {
      this.persistChanged();
    }, this.persistIntervalMs || this.defaultOpts.persistIntervalMs);
  }

  addChanged(entity: { id: string }) {
    this.changed.add(entity.id);
    const hasChangedEnough =
      this.changed.size >
      (this.persistAfterChangeCount !== undefined
        ? this.persistAfterChangeCount
        : this.defaultOpts.persistAfterChangeCount);

    if (hasChangedEnough) {
      this.persistChanged();
    }
  }

  persistChanged() {
    if (!this.jsonDB) return;
    if (!this.entities) throw new Error("Entities not set" + this.namespace);
    const n = this.changed.size;
    for (const id of this.changed) {
      const entity = this.entities.get(id);
      try {
        if (!entity) {
          this.jsonDB.delete(id);
        } else {
          this.jsonDB.set(entity.id, entity, this.namespace);
        }
      } catch (e) {
        console.error(e);
        console.error("Failed to persist changed", entity || id);
      }
      this.changed.delete(id);
    }
    if (n > 0) console.log("persisted", n, "entities", this.namespace);
  }

  close() {
    console.log("shutdown gracefully, persisting entities", this.namespace);
    this.timer && clearInterval(this.timer);
    this.persistChanged();
    this.jsonDB.db.close();
  }

  clean() {
    if (process.env.NODE_ENV === "production") return;
    this.jsonDB.deleteAll(this.namespace);
  }
}
