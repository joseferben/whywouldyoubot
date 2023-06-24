import type { Player } from "~/pure/engine/core";

const TEN_SECONDS_MS = 10000;

export class OnlineService {
  private players: { [k: string]: number };
  logoutAfterIdleMs: number;

  constructor(onlineTimeoutMs: number) {
    this.logoutAfterIdleMs = onlineTimeoutMs;
    //TODO use helper
    this.players = {};

    //TODO use helper
    setInterval(() => {
      for (const [playerId, lastOnlineAt] of Object.entries(this.players)) {
        if (lastOnlineAt + this.logoutAfterIdleMs <= Date.now()) {
          console.debug(`player ${playerId} not online anymore`);
          delete this.players[playerId];
        }
      }
    }, TEN_SECONDS_MS);
  }

  onlinePlayers() {
    return this.players;
  }

  ensureOnline(player: Player) {
    console.debug(`ensure player is online: ${player.username}`);
    const now = Date.now();
    this.players[player.id] = now;
  }

  /** Return true if player is online. */
  online(p: Player): boolean {
    return !!this.players[p.id];
  }

  logout(player: Player) {
    delete this.players[player.id];
  }
}
