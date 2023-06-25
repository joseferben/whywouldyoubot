import type { Player } from "~/engine/core";
import type { MapService } from "./MapService";
import type { OnlineService } from "./OnlineService";
import type { PlayerService } from "./PlayerService";

export class WalkService {
  constructor(
    readonly mapService: MapService,
    readonly playerService: PlayerService,
    readonly onlineService: OnlineService
  ) {}

  canWalk(player: Player, x: number, y: number): boolean {
    return (
      //!this.attackService.fights.players[player.id] &&
      this.playerService.canReach(player, x, y) &&
      !this.mapService.isObstacle(x, y)
    );
  }

  walk(player: Player, x: number, y: number) {
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
