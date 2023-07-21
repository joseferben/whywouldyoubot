import { EventEmitter } from "node:events";
import { initOnce } from "~/utils";
import type {
  Player,
  SerializedClientState,
  ServerEvent,
  ShownEmoji,
} from "@wwyb/core";
import { EntityDB } from "@wwyb/entitydb";
import type { PlayerService } from "./PlayerService";
import { Profiler } from "./Profiler";

export type PlayerEmitter = {
  id: string;
  playerId: string;
  emitter: Emitter;
};

class Emitter {
  constructor(readonly emitter: EventEmitter) {}

  on(listener: (event: ServerEvent) => void) {
    this.emitter.on("event", listener);
  }
}

export class ServerEventService extends Profiler {
  readonly db!: EntityDB<PlayerEmitter>;
  constructor(readonly playerService: PlayerService) {
    super();
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<PlayerEmitter>({
          fields: ["playerId"],
          namespace: "pem",
        })
    );
  }

  sendToAll(event: ServerEvent) {
    this.db.findAll().forEach((playerEmitter) => {
      console.log("send event to player", playerEmitter.playerId);
      playerEmitter.emitter.emitter.emit("event", event);
    });
  }

  playerStepped(player: Player, x: number, y: number, lastStep: boolean) {
    const state: SerializedClientState = {
      me: player,
      players: this.playerService.findAroundPlayer(player),
    };
    this.sendToAll({
      state,
      timestamp: Date.now(),
      event: {
        tag: "playerStepped",
        playerId: player.id,
        x,
        y,
        lastStep,
      },
    });
  }

  playerShownEmoji(player: Player, shownEmojis: ShownEmoji[]) {
    const state: SerializedClientState = {
      me: player,
      shownEmojis,
    };
    this.sendToAll({
      state,
      timestamp: Date.now(),
      event: {
        tag: "state",
      },
    });
  }

  playerUnshownEmoji(player: Player, shownEmojis: ShownEmoji[]) {
    const state: SerializedClientState = {
      me: player,
      shownEmojis,
    };
    this.sendToAll({
      state,
      timestamp: Date.now(),
      event: {
        tag: "state",
      },
    });
  }

  playerEmitter(player: Player) {
    const found = this.db.findOneBy("playerId", player.id);
    if (!found) {
      const emitter = new EventEmitter();
      return this.db.create({
        playerId: player.id,
        emitter: new Emitter(emitter),
      });
    }
    return found;
  }
}
