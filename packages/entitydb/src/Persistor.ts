import invariant from "tiny-invariant";
import type { JSONStore } from "./JSONStore";

const usedNamespaces = new Set<string>();

export class Persistor {
  defaultOpts = {
    persistIntervalMs: 1000,
    persistAfterChangeCount: process.env.NODE_ENV === "production" ? 10 : 0,
  };
  changed: Set<string> = new Set();
  timer: NodeJS.Timer | undefined;
  entities: Map<string, { v?: number; id: string }> | undefined;

  constructor(
    readonly jsonDB: JSONStore,
    readonly namespace: string,
    readonly persistIntervalMs?: number,
    readonly persistAfterChangeCount?: number
  ) {
    if (usedNamespaces.has(namespace)) {
      throw new Error(`Persistor namespace ${namespace} already in use`);
    }
    usedNamespaces.add(namespace);
  }

  static namespaces() {
    return usedNamespaces;
  }

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
      invariant(json.id !== undefined, "Entity must have an id");
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
    usedNamespaces.delete(this.namespace);
    this.jsonDB.db.close();
  }
}
