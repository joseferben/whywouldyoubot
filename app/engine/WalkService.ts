import type { Player } from "~/engine/core";
import type { WorldMapService } from "./WorldMapService";
import type { OnlineService } from "./OnlineService";
import type { PlayerService } from "./PlayerService";
import { EntityDB } from "./EntityDB/EntityDB";

export type Walk = {
  id: string;
  playerId: string;
  x: number;
  y: number;
};

export class WalkService {
  db: EntityDB<Walk>;
  constructor(
    readonly mapService: WorldMapService,
    readonly playerService: PlayerService,
    readonly onlineService: OnlineService
  ) {
    const [db, foundInCache] = EntityDB.builder<Walk>().buildForRemix(
      this.constructor.name
    );
    this.db = db;
  }

  canWalk(player: Player, x: number, y: number): boolean {
    return (
      //!this.attackService.fights.players[player.id] &&
      this.playerService.canReach(player, x, y) &&
      !this.mapService.isObstacle(x, y)
    );
  }

  startWalk(player: Player, x: number, y: number) {
    this.onlineService.ensureOnline(player);
    console.debug(`walk ${player.id}`, player.x, player.y);
    if (!this.canWalk(player, x, y)) {
      console.warn(`player ${player.id} tried to walk to (${x}/${y})`);
    }
    player.x = x;
    player.y = y;
    this.playerService.db.update(player);
  }
}
