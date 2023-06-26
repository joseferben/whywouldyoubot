import type { Database, Statement } from "better-sqlite3";

export interface JSONDB {
  delete(id: string): void;
  set(id: string, json: string): void;
  all(): string[];
}

export class JSONDB {
  deleteStmt!: Statement<{ id: string }>;
  insertStmt!: Statement<{ id: string; data: string; created: number }>;
  updateStmt!: Statement<{ id: string; data: string }>;
  selectStmt!: Statement;
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
        data TEXT NOT NULL CHECK(json_valid(data)),
        created INT NOT NULL
      )
    `
      )
      .run();
    this.db.prepare(
      "CREATE INDEX IF NOT EXISTS entities_created ON entities(created)"
    );
  }

  private prepareStatements() {
    // needs to be sorted to reproduce the same order every time
    this.selectStmt = this.db.prepare(
      "SELECT id, data FROM entities ORDER BY created ASC"
    );
    this.deleteStmt = this.db.prepare("DELETE FROM entities WHERE id = @id");
    this.insertStmt = this.db.prepare(
      "INSERT INTO entities VALUES (@id, @data, @created)"
    );
    this.updateStmt = this.db.prepare(
      "UPDATE entities SET data = @data WHERE id = @id"
    );
    this.hasStmt = this.db.prepare("SELECT id FROM entities WHERE id = @id");
  }

  delete(id: string) {
    this.deleteStmt.run({ id });
  }

  set<E>(id: string, json: E) {
    if (this.hasStmt.get({ id })) {
      this.updateStmt.run({ id, data: JSON.stringify(json) });
    } else {
      this.insertStmt.run({
        id,
        data: JSON.stringify(json),
        created: Date.now(),
      });
    }
  }

  all<E>(): E[] {
    return (this.selectStmt.all() as { data: string }[]).map((row) =>
      JSON.parse(row.data)
    );
  }
}
