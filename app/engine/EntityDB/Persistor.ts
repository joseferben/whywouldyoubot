import invariant from "tiny-invariant";
import type { JSONDB } from "../JSONDB";

export class Persistor {
  defaultOpts = {
    persistIntervalMs: 1000,
    persistAfterChangeCount: 10,
  };
  changed: Set<string> = new Set();
  timer: NodeJS.Timer | undefined;
  entities: Map<string, { v?: number; id: string }> | undefined;

  constructor(
    readonly jsonDB: JSONDB,
    readonly persistIntervalMs?: number,
    readonly persistAfterChangeCount?: number
  ) {
    this.schedulePersist();
  }

  setEntities(entities: Map<string, { v?: number; id: string }>) {
    this.entities = entities;
  }
  /**
   * Load the entities from the JSON store and insert them into the in-memory store.
   */
  loadEntities(fun?: (e: any) => void) {
    if (!this.jsonDB) return;
    const jsons = this.jsonDB.all();
    for (const json of jsons) {
      invariant((json as any).id !== undefined, "Entity must have an id");
      invariant(
        (json as any).v !== undefined,
        `Entity ${(json as any).id} must have a version`
      );
      const entity = json;
      if (fun) fun(entity);
    }
  }

  schedulePersist() {
    if (!this.jsonDB) return;
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
    if (!this.entities)
      throw new Error("Can not persist changes without entities map");
    for (const id of this.changed) {
      const entity = this.entities.get(id);
      try {
        if (!entity) {
          this.jsonDB.delete(id);
        } else {
          this.jsonDB.set(entity.id, JSON.stringify(entity));
        }
      } catch (e) {
        console.error(e);
        console.error("Failed to persist changed", entity || id);
      }
      this.changed.delete(id);
    }
  }

  close() {
    this.jsonDB.db.close();
    this.timer && clearInterval(this.timer);
    this.persistChanged();
  }
}
