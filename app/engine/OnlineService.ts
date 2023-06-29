import type { Player } from "~/engine/core";
import { initOnce } from "~/utils";
import { EntityDB } from "./EntityDB/EntityDB";

export type PlayerOnline = {
  id: string;
  playerId: string;
  lastOnlineAt: number;
};

export class OnlineService {
  db: EntityDB<PlayerOnline>;

  constructor(readonly onlineTimeoutMs: number) {
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<PlayerOnline>({
          fields: ["playerId"],
          evictorListener: (p) => this.setOffline(p),
        })
    );
  }

  findAllOnlinePlayerIds() {
    return this.db.findAll().map((p) => p.playerId);
  }

  ensureOnline(player: Player) {
    console.debug(`ensure player is online: ${player.username}`);
    const now = Date.now();
    const found = this.db.findOneBy("playerId", player.id);
    if (!found) {
      this.db.create(
        {
          playerId: player.id,
          lastOnlineAt: now,
        },
        { ttlMs: this.onlineTimeoutMs }
      );
    } else {
      // resetting the counter
      this.db.expire(found, this.onlineTimeoutMs);
    }
  }

  /** Return true if player is online. */
  isOnline(p: Player): boolean {
    return this.db.findOneBy("playerId", p.id) !== null;
  }

  private setOffline(p: PlayerOnline) {
    console.log("logging out player", p.playerId);
    // TODO logout player
  }
}
