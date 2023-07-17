import type { Player } from "@wwyb/core";
import { EntityDB } from "@wwyb/entitydb";
import { initOnce } from "~/utils";

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
          namespace: "onp",
          fields: ["playerId"],
        })
    );
  }

  findAllOnlinePlayerIds() {
    return this.db.findAll().map((p) => p.playerId);
  }

  ensureOnline(player: Player) {
    console.debug(`player is online: ${player.username}`);
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

  /**
   * Return true if player is online.
   */
  isOnline(p: Player): boolean {
    return this.db.findBy("playerId", p.id).length > 0;
  }

  setOfflineById(playerId: string) {
    console.log("logging out player", playerId);
    const playerOnline = this.db.findOneBy("playerId", playerId);
    if (playerOnline) {
      this.db.delete(playerOnline);
    }
  }
}
