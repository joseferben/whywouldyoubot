import type { Database, Statement } from "better-sqlite3";

export interface JSONStore {
  delete(id: string): void;
  set(id: string, json: string, namespace?: string): void;
  all(namespace?: string): string[];
  deleteAll(namespace: string): void;
}

export class JSONStore {
  deleteStmt!: Statement<{ id: string }>;
  insertStmt!: Statement<{
    id: string;
    namespace: string;
    data: string;
    created: number;
  }>;
  updateStmt!: Statement<{ id: string; data: string }>;
  selectStmt!: Statement<{ namespace: string }>;
  hasStmt!: Statement<{ id: string }>;

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
        namespace TEXT NOT NULL,
        data TEXT NOT NULL CHECK(json_valid(data)),
        created INT NOT NULL
      )
    `
      )
      .run();
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_created ON entities(created)"
    );
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_namespace ON entities(namespace)"
    );
  }

  private prepareStatements() {
    // needs to be sorted to reproduce the same order every time
    this.selectStmt = this.db.prepare(
      "SELECT id, data FROM entities WHERE namespace = @namespace ORDER BY created ASC"
    );
    this.deleteStmt = this.db.prepare("DELETE FROM entities WHERE id = @id");
    this.insertStmt = this.db.prepare(
      "INSERT INTO entities VALUES (@id, @namespace, @data, @created)"
    );
    this.updateStmt = this.db.prepare(
      "UPDATE entities SET data = @data WHERE id = @id"
    );
    this.hasStmt = this.db.prepare("SELECT id FROM entities WHERE id = @id");
  }

  delete(id: string) {
    this.deleteStmt.run({ id });
  }

  set<E>(id: string, json: E, namespace = "def") {
    if (this.hasStmt.get({ id })) {
      this.updateStmt.run({ id, data: JSON.stringify(json) });
    } else {
      this.insertStmt.run({
        id,
        namespace,
        data: JSON.stringify(json),
        created: Date.now(),
      });
    }
  }

  all<E>(namespace = "def"): E[] {
    return (this.selectStmt.all({ namespace }) as { data: string }[]).map(
      (row) => JSON.parse(row.data)
    );
  }

  deleteAll(namespace?: string) {
    this.db.prepare("DELETE FROM entities WHERE namespace = @namespace").run({
      namespace,
    });
  }
}
