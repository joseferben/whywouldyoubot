import type { Item, Player, User } from "~/engine/core";
import type { Database, Statement } from "better-sqlite3";
import { SpatialEntityDB } from "./SpatialEntityDB";
import type { DataRow } from "./EntityDB";

export const userType = "use";
export const playerType = "pla";
export const itemType = "ite";

type PersistentEntityMap = {
  [userType]: User;
  [playerType]: Player;
  [itemType]: Item;
};

const selectDataByPlayerInventorySql = `
SELECT D2.id, D2.key, D2.value, D2.type 
FROM data DP
JOIN data DB on DP.id = DB.id
JOIN data D2 on DX.id = D2.id
JOIN entities E on DX.id = E.id
WHERE 
    E.type = @type 
    AND DP.key = 'playerId' AND DP.value = @playerId
    AND DB.key = 'bank' AND DB.value = @bank
ORDER BY D2.id
`;

const selectHashedPasswordByUserIdSql = `
SELECT D.value
FROM data D
JOIN entities E on D.id = E.id
WHERE
    E.type = @type
    AND D.key = 'password'
    AND E.id = @id
`;

export class GameDB extends SpatialEntityDB<PersistentEntityMap> {
  selectDataByPlayerInventoryStmt: Statement<{
    playerId: string;
    type: string;
    bank: boolean;
  }>;
  selectHashedPasswordByUserIdStmt: Statement<{
    id: string;
    type: string;
  }>;
  constructor(db: Database) {
    super(db);
    this.selectDataByPlayerInventoryStmt = this.db.prepare(
      selectDataByPlayerInventorySql
    );
    this.selectHashedPasswordByUserIdStmt = this.db.prepare(
      selectHashedPasswordByUserIdSql
    );
  }

  findItemByPlayerInventory(playerId: string): Item[] {
    const rows = this.selectDataByPlayerInventoryStmt.all({
      type: itemType,
      playerId,
      bank: false,
    }) as DataRow[];
    return this.deserializeAll(rows) as Item[];
  }

  findUserByEmail(email: string): User | null {
    return this.findByField(userType, "email", email);
  }

  findUserByUsername(username: string): User | null {
    return this.findByField(userType, "username", username);
  }

  findPlayerByUserId(userId: string): Player | null {
    return this.findByField(playerType, "userId", userId);
  }

  findPlayerByUserEmail(email: string): Player | null {
    const user = this.findUserByEmail(email);
    if (!user) {
      return null;
    }
    return this.findPlayerByUserId(user.id);
  }

  findPlayerByUserUsername(username: string): Player | null {
    const user = this.findUserByUsername(username);
    if (!user) {
      return null;
    }
    return this.findPlayerByUserId(user.id);
  }

  findHashedPasswordByUserId(userId: string): string | null {
    return (
      (
        this.selectHashedPasswordByUserIdStmt.get({
          id: userId,
          type: userType,
        }) as DataRow | undefined
      )?.value ?? null
    );
  }
}
