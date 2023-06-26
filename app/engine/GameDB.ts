import type { Item, Player, User } from "~/engine/core";
import { createClient } from "redis";
import type { RedisClientConnection } from "redis-om";
import { Schema } from "redis-om";
import { Repository } from "redis-om";
import Item from "~/components/item/Item";

const schema = new Schema("album", {
  artist: { type: "string" },
  title: { type: "text" },
  year: { type: "number" },
});

export class GameDB {
  redis: RedisClientConnection;
  repo: Repository;
  constructor(url: string) {
    this.redis = createClient({ url });
    this.repo = new Repository(schema, this.redis);
  }

  async connect() {
    await this.redis.connect();
    const foo = this.repo.fetch("sdf");
  }

  findItemByPlayerInventory(playerId: string): Item[] {}

  findUserByEmail(email: string): User | null {}
  findByField(userType: any, arg1: string, email: string): User | null {}

  findUserByUsername(username: string): User | null {}

  findPlayerByUserId(userId: string): Player | null {}

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

  findHashedPasswordByUserId(userId: string): string | null {}
}
