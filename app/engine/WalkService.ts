import type { Player } from "~/engine/core";
import type { WorldMapService } from "./WorldMapService";
import type { OnlineService } from "./OnlineService";
import type { PlayerService } from "./PlayerService";
import type { EntityDB } from "./EntityDB/EntityDB";
import { entityDB } from "./EntityDB/EntityDB";
import easystarjs from "easystarjs";
import { initOnce } from "~/utils";
import type { ClientEventService } from "./ClientEventService";

export type Walk = {
  id: string;
  playerId: string;
  path: { x: number; y: number }[];
  timer: NodeJS.Timer;
};

export class WalkService {
  db: EntityDB<Walk>;
  easystar: easystarjs.js;

  constructor(
    readonly clientEventService: ClientEventService,
    readonly worldMapService: WorldMapService,
    readonly playerService: PlayerService,
    readonly onlineService: OnlineService
  ) {
    [this.db] = initOnce(this.constructor.name, () =>
      entityDB<Walk>().withFields(["playerId"]).build()
    );
    const [obstacleGrid] = initOnce(
      `${this.constructor.name}.obstacleGrid`,
      () => this.calculateObstacleGrid()
    );
    this.easystar = new easystarjs.js();
    this.easystar.enableSync();
    this.easystar.enableDiagonals();
    this.easystar.setGrid(obstacleGrid);
    this.easystar.setAcceptableTiles([0]);
  }

  /**
   * Return a 2d array where 0 is walkable and 1 is not walkable.
   */
  calculateObstacleGrid(): number[][] {
    // TODO get somehwre else
    const height = 1000;
    const width = 1000;
    const grid: number[][] = Array(height)
      .fill(undefined)
      .map(() => Array(width).fill(0));
    for (const tile of this.worldMapService.db.findAll()) {
      if (tile.obstacle) {
        grid[tile.y][tile.x] = 1;
      }
    }
    return grid;
  }

  calculatePath(fromX: number, fromY: number, toX: number, toY: number) {
    let path: { x: number; y: number }[] = [];
    this.easystar.findPath(fromX, fromY, toX, toY, (p) => (path = p));
    this.easystar.calculate();
    // remove first element because it's the current position
    path.shift();
    return path;
  }

  canWalk(player: Player, x: number, y: number): boolean {
    return (
      //!this.attackService.fights.players[player.id] &&
      this.playerService.canReach(player, x, y) &&
      !this.worldMapService.isObstacle(x, y)
    );
  }

  step(playerId: string) {
    const player = this.playerService.db.findById(playerId);
    if (!player) return;
    const walk = this.db.findOneBy("playerId", player.id);
    if (!walk) return;
    const nextPosition = walk.path.shift();
    if (!nextPosition) {
      console.log(`finished walking ${player.id}`);
      clearInterval(walk.timer);
      this.db.delete(walk);
      return;
    }
    player.x = nextPosition.x;
    player.y = nextPosition.y;
    this.playerService.db.update(player);
    this.db.update(walk);
    this.clientEventService.playerStepped(player, player.x, player.y);
  }

  startWalk(player: Player, x: number, y: number) {
    if (!this.canWalk(player, x, y)) {
      console.warn(`player ${player.id} tried to walk to (${x}/${y})`);
      return;
    }

    console.debug(`start walking ${player.id}`, player.x, player.y);
    this.onlineService.ensureOnline(player);

    // stop previous walk
    const found = this.db.findOneBy("playerId", player.id);
    if (found) {
      clearInterval(found.timer);
      this.db.delete(found);
    }

    const path = this.calculatePath(player.x, player.y, x, y);
    this.step(player.id);
    const timer = setInterval(() => this.step(player.id), 500);
    this.db.create({ playerId: player.id, path, timer });
  }
}
