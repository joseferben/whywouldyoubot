import type { Entity } from "./core";
import type { DataRow } from "./EntityDB";
import { EntityDB } from "./EntityDB";
import type { Database, Statement } from "better-sqlite3";

const selectDataByPositionAndTypeSql = `
SELECT D2.id, D2.key, D2.value, D2.type 
FROM data DX
JOIN data DY on DX.id = DY.id
JOIN data D2 on DX.id = D2.id
JOIN entities E on DX.id = E.id
WHERE 
    E.type = @type 
    AND DX.key = 'x' AND DX.value = @x
    AND DY.key = 'y' AND DY.value = @y
ORDER BY D2.id
`;

const selectDataByRectangleAndTypeSql = `
SELECT D2.id, D2.key, D2.value, D2.type
FROM data DX
JOIN data DY on DX.id = DY.id
JOIN data D2 on DX.id = D2.id
JOIN entities E on DX.id = E.id
WHERE 
    E.type = @type 
    AND DX.key = 'x' AND CAST(DX.value as INTEGER) >= @x1 AND CAST(DX.value as integer) <= @x2
    AND DY.key = 'y' AND CAST(DY.value as INTEGER) >= @y1 AND CAST(DY.value as integer) <= @y2
ORDER BY D2.id
`;

export class SpatialEntityDB<
  M extends Record<string, Entity>
> extends EntityDB<M> {
  selectDataByPositionAndTypeStmt: Statement<{
    type: string;
    x: number;
    y: number;
  }>;
  selectDataByRectangleAndTypeStmt: Statement<{
    type: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;

  constructor(db: Database) {
    super(db);
    this.selectDataByPositionAndTypeStmt = this.db.prepare(
      selectDataByPositionAndTypeSql
    );
    this.selectDataByRectangleAndTypeStmt = this.db.prepare(
      selectDataByRectangleAndTypeSql
    );
  }

  findByPosition<K extends keyof M>(type: K, x: number, y: number): M[K][] {
    const rows = this.selectDataByPositionAndTypeStmt.all({
      type: type as string,
      x,
      y,
    }) as DataRow[];
    return this.deserializeAll(rows);
  }

  findByRectangle<K extends keyof M>(
    type: K,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): M[K][] {
    const rows = this.selectDataByRectangleAndTypeStmt.all({
      type: type as string,
      x1,
      y1,
      x2,
      y2,
    }) as DataRow[];
    return this.deserializeAll(rows);
  }
}
