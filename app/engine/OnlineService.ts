import type { Player } from "~/engine/core";
import { initOnce } from "~/utils";
import { EntityDB } from "./EntityDB/EntityDB";

const TEN_SECONDS_MS = 10000;

export type PlayerOnline = {
  id: string;
  playerId: string;
  lastOnlineAt: number;
};

export class OnlineService {
  db: EntityDB<Player>;

  constructor(onlineTimeoutMs: number) {
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<Player>({
          evictorListener: (p) => this.logout(p),
        })
    );

    //TODO use helper
    // setInterval(() => {
    //   for (const [playerId, lastOnlineAt] of Object.entries(this.players)) {
    //     if (lastOnlineAt + this.logoutAfterIdleMs <= Date.now()) {
    //       console.debug(`player ${playerId} not online anymore`);
    //       delete this.players[playerId];
    //     }
    //   }
    // }, TEN_SECONDS_MS);
  }

  onlinePlayers() {
    return this.db;
  }

  ensureOnline(player: Player) {
    console.debug(`ensure player is online: ${player.username}`);
    const now = Date.now();
    this.db.evictor.expire(player);
    //this.players[player.id] = now;
  }

  /** Return true if player is online. */
  online(p: Player): boolean {
    //return !!this.players[p.id];
    return true;
  }

  logout(player: Player) {
    //delete this.players[player.id];
  }
}
