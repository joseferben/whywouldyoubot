import type { Player } from "@wwyb/core";
import type { WorldMapService } from "./WorldMapService";
import type { OnlineService } from "./OnlineService";
import type { PlayerService } from "./PlayerService";
import easystarjs from "easystarjs";
import { initOnce } from "~/utils";
import type { ServerEventService } from "./ServerEventService";
import { EntityDB } from "@wwyb/entitydb";
import { Profiler } from "./Profiler";

export type Walk = {
  id: string;
  playerId: string;
  path: { x: number; y: number }[];
  timer: NodeJS.Timer;
  created: number;
};

export class WalkService extends Profiler {
  db: EntityDB<Walk>;
  easystar: easystarjs.js;

  constructor(
    readonly serverEventService: ServerEventService,
    readonly worldMapService: WorldMapService,
    readonly playerService: PlayerService,
    readonly onlineService: OnlineService
  ) {
    super();
    [this.db] = initOnce(
      this.constructor.name,
      () => new EntityDB<Walk>({ fields: ["playerId"], namespace: "wal" })
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
    const grid: number[][] = Array(this.worldMapService.db.getMaxY())
      .fill(undefined)
      .map(() => Array(this.worldMapService.db.getMaxX()).fill(0));
    for (const tile of this.worldMapService.db.findAll()) {
      if (tile.obstacle) {
        grid[tile.y][tile.x] = 1;
      }
    }
    return grid;
  }

  calculatePath(fromX: number, fromY: number, toX: number, toY: number) {
    let path: { x: number; y: number }[] | null = [];
    this.easystar.findPath(fromX, fromY, toX, toY, (p) => (path = p));
    this.easystar.calculate();
    // remove first element because it's the current position
    if (!path) return null;
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
    console.log(`step ${playerId}`);
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
    const lastStep = walk.path.length === 0;
    this.serverEventService.playerStepped(player, player.x, player.y, lastStep);
  }

  startWalk(player: Player, x: number, y: number) {
    if (!this.canWalk(player, x, y)) {
      console.warn(`player ${player.id} tried to walk to (${x}/${y})`);
      return;
    }

    console.debug(`start walking ${player.id}`, player.x, player.y);
    this.onlineService.ensureOnline(player);

    const found = this.db.findOneBy("playerId", player.id);

    // wait for cooldown
    if (found && found.created >= Date.now() - 1000) return;

    const path = this.calculatePath(player.x, player.y, x, y);

    if (!path) {
      console.warn(`no path found for ${player.id} to (${x}/${y})`);
      return;
    }

    // stop previous walk
    if (found) {
      clearInterval(found.timer);
      this.db.delete(found);
    }

    const timer = setInterval(() => this.step(player.id), 500);
    this.db.create({ playerId: player.id, path, timer, created: Date.now() });
    this.step(player.id);
  }
}
