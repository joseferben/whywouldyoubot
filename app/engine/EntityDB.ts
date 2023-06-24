import type { Database, Statement } from "better-sqlite3";
import { nanoid } from "nanoid";
import type { Entity } from "~/engine/core";

export type DataRow = {
  id: string;
  key: string;
  value: string;
  type: number;
};

export class EntityDB<M extends Record<string, Entity>> {
  private insertEntityStmt!: Statement<
    [{ type: string; id: string; created: number }]
  >;
  private insertDataStmt!: Statement<
    [
      {
        id: string;
        key: string;
        value: object | string | number | boolean;
        type: number;
      }
    ]
  >;
  private deleteDataStmt!: Statement<[{ id: string }]>;
  private deleteEntityStmt!: Statement<[{ id: string }]>;
  private selectDataByIdStmt!: Statement<[{ id: string }]>;
  private selectDataByFieldStmt!: Statement<
    [{ type: string; key: string; value: string }]
  >;
  private updateDataStmt!: Statement<
    [{ id: string; key: string; value: string }]
  >;
  selectDataByTypeStmt!: Statement<{ type: string; limit: number }>;
  selectCountEntityStmt!: Statement<{ type: string }>;

  constructor(readonly db: Database) {
    this.createTables();
    this.prepareStatements();
  }

  private createTables() {
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        created INT NOT NULL,
        updated INT NULL
      )
    `
      )
      .run();
    this.db
      .prepare("CREATE INDEX IF NOT EXISTS entities_type ON entities(type)")
      .run();
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_created ON entities(created)"
    );
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_updated ON entities(updated)"
    );

    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS data (
        id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        type INTEGER NOT NULL
      )
    `
      )
      .run();

    this.db.prepare("CREATE INDEX IF NOT EXISTS data_id ON data(id)");
    this.db.prepare("CREATE INDEX IF NOT EXISTS data_key ON data(key)");
    this.db.prepare("CREATE INDEX IF NOT EXISTS data_value ON data(value)");
    this.db.prepare("CREATE INDEX IF NOT EXISTS data_type ON data(type)");
  }

  private prepareStatements() {
    this.insertEntityStmt = this.db.prepare(
      "INSERT INTO entities (id, type, created) VALUES (@id, @type, @created)"
    );
    this.insertDataStmt = this.db.prepare(
      "INSERT INTO data (id, key, value, type) VALUES (@id, @key, @value, @type)"
    );
    this.updateDataStmt = this.db.prepare(
      "UPDATE data SET value = @value WHERE id = @id AND key = @key"
    );
    this.deleteDataStmt = this.db.prepare("DELETE FROM data WHERE id = @id");
    this.deleteEntityStmt = this.db.prepare(
      "DELETE FROM entities WHERE id = @id"
    );
    this.selectCountEntityStmt = this.db.prepare(
      "SELECT COUNT(*) FROM entities WHERE type = @type"
    );

    this.selectDataByIdStmt = this.db.prepare(
      "SELECT key, value, type FROM data WHERE id = @id"
    );
    this.selectDataByTypeStmt = this.db.prepare(
      `SELECT data.id, key, value, data.type FROM data 
       JOIN entities ON entities.id = data.id
       WHERE entities.type = @type 
       ORDER BY data.id
       LIMIT @limit
       `
    );
    this.selectDataByFieldStmt = this.db.prepare(
      `SELECT data.id, key, value, data.type FROM data 
       JOIN entities ON entities.id = data.id
       WHERE entities.type = @type 
         AND key = @key 
         AND value = @value 
       ORDER BY data.id`
    );
  }

  create<K extends keyof M>(
    type: K,
    entity: Omit<M[K], "id">,
    transaction = true
  ): M[K] {
    const id = nanoid();
    const created = Date.now();
    const fun = () => {
      this.insertEntityStmt.run({
        id,
        type: type as string,
        created,
      });

      for (const key in entity) {
        if (Object.prototype.hasOwnProperty.call(entity, key) && key !== "id") {
          const value = (entity as { [key: string]: string })[key];
          const typeOfValue = typeof value;
          // string
          let type = 3;
          if (typeOfValue === "number") {
            type = 0;
          } else if (typeOfValue === "boolean") {
            type = 1;
          } else if (typeOfValue === "object") {
            type = 2;
          } else if (typeOfValue === "function") {
            throw new Error("Cannot store functions in the database");
          } else if (typeOfValue === "symbol") {
            throw new Error("Cannot store symbols in the database");
          }
          let valueToStore = value;
          if (typeOfValue === "object") {
            valueToStore = JSON.stringify(value) as string;
          } else if (typeOfValue === "boolean") {
            valueToStore = value ? "true" : "false";
          }
          this.insertDataStmt.run({
            id,
            key,
            value: valueToStore,
            type,
          });
        }
      }
    };
    if (transaction) {
      this.db.transaction(fun)();
    } else {
      fun();
    }
    return { id: `${type as string}_${id}`, ...entity } as M[K];
  }

  // TODO consider exposing update of singular fields
  update<K extends keyof M>(entity: M[K], transaction = true) {
    const fun = () => {
      for (const key in entity) {
        if (Object.prototype.hasOwnProperty.call(entity, key) && key !== "id") {
          const value = (
            entity as { [key: string]: string | object | number | boolean }
          )[key];
          const typeOfValue = typeof value;
          let valueToStore = value;
          if (typeOfValue === "object") {
            valueToStore = JSON.stringify(value) as string;
          } else if (typeOfValue === "boolean") {
            valueToStore = value ? "true" : "false";
          }
          this.updateDataStmt.run({
            id: this.idToLocalId(entity.id),
            key,
            value: valueToStore as string,
          });
        }
      }
    };
    if (transaction) {
      this.db.transaction(fun)();
    } else {
      fun();
    }
  }

  delete(id: string, transaction = true) {
    const fun = () => {
      this.deleteDataStmt.run({ id: this.idToLocalId(id) });
      this.deleteEntityStmt.run({ id: this.idToLocalId(id) });
    };
    if (transaction) {
      this.db.transaction(fun)();
    } else {
      fun();
    }
  }

  idToLocalId(id: string): string {
    return id.substring(4);
  }

  parseRow<K extends keyof M>(
    row: DataRow
  ): string | number | object | boolean {
    switch (row.type) {
      // "number"
      case 0:
        return Number(row.value) as M[K][keyof M[K]];
      // "boolean"
      case 1:
        return (row.value === "true") as M[K][keyof M[K]];
      // "object"
      case 2:
        return JSON.parse(row.value);
      // "string"
      default:
        return row.value as M[K][keyof M[K]];
    }
  }

  deserialize<K extends keyof M>(
    _type: K,
    id: string,
    dataRows: DataRow[]
  ): M[K] | null {
    if (!dataRows.length) {
      return null;
    }
    const entity = { id } as {
      [key: string]: string | number | object | boolean;
    };
    for (const row of dataRows) {
      entity[row.key] = this.parseRow(row);
    }
    return entity as M[K];
  }

  deserializeAll<K extends keyof M>(dataRows: DataRow[]): M[K][] {
    if (!dataRows.length) {
      return [];
    }
    const entities: {
      [key: string]: { [key: string]: string | number | object | boolean };
    } = {};
    for (const row of dataRows) {
      const id = row.id;
      if (!entities[id]) {
        entities[id] = { id } as M[K];
      }
      entities[id][row.key] = this.parseRow(row);
    }
    return Object.values(entities) as M[K][];
  }

  findById<K extends keyof M>(type: K, id: string): M[K] | null {
    const dataRows = this.selectDataByIdStmt.all({
      id: this.idToLocalId(id),
    }) as DataRow[];
    return this.deserialize(type, id, dataRows);
  }

  findAllByField<K extends keyof M, F extends keyof M[K]>(
    type: K,
    field: F,
    value: M[K][F]
  ): M[K][] {
    const dataRows = this.selectDataByFieldStmt.all({
      type: type as string,
      key: field as string,
      value: value,
    }) as DataRow[];
    return this.deserializeAll(dataRows);
  }

  /**
   * Return the first entity found or null if none found and raises
   * an error if more than one entity is found.
   */
  findByField<K extends keyof M, F extends keyof M[K]>(
    type: K,
    field: F,
    value: M[K][F]
  ): M[K] | null {
    const entities = this.findAllByField(type, field, value);
    if (entities.length === 0) {
      return null;
    } else if (entities.length > 1) {
      throw new Error("More than one entity found");
    } else {
      return entities[0];
    }
  }

  /**
   * Return all entities of the given type with a default limit of 50.
   */
  findAll<K extends keyof M>(type: K, limit = 50): M[K][] {
    const dataRows = this.selectDataByTypeStmt.all({
      type: type as string,
      limit,
    }) as DataRow[];
    return this.deserializeAll(dataRows);
  }

  /**
   * Return the number of entities of the given type.
   */
  count<K extends keyof M>(type: K): number {
    const count = this.selectCountEntityStmt.get({ type: type as string }) as {
      count: number;
    };
    return count ? count.count : 0;
  }

  /**
   * Close the database connection.
   */
  close() {
    this.db.close();
  }
}
