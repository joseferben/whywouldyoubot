import { EntityDB } from "@wwyb/entitydb";
import type { JSONStore } from "@wwyb/entitydb";
import { initOnce } from "~/utils";
import { type Bot, type Player } from "@wwyb/core";
import { customAlphabet } from "nanoid";
import { validateName, type PlayerService } from "./PlayerService";
import type { OnlineService } from "./OnlineService";

export class BotService {
  db!: EntityDB<Bot>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly playerService: PlayerService,
    readonly onlineService: OnlineService,
    readonly maxBotsPerPlayer: number
  ) {
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<Bot>({
          namespace: "bot",
          fields: ["ownerId", "playerId", "name", "apiKey"],
          jsonStore,
        })
    );
  }

  create(botName: string, owner: Player): Bot | string {
    const nameValidation = validateName(botName);
    if (nameValidation) return nameValidation;
    if (this.db.findBy("name", botName).length > 0) return "Name already taken";
    if (this.db.findBy("ownerId", owner.id).length >= this.maxBotsPerPlayer) {
      return "You have too many bots";
    }

    const playerOrError = this.playerService.create(botName);
    if (typeof playerOrError === "string") return playerOrError;
    return this.db.create({
      name: botName,
      ownerId: owner.id,
      playerId: playerOrError.id,
      apiKey: customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890")(),
    });
  }

  findByOwner(player: Player): Bot[] {
    return this.db.findBy("ownerId", player.id);
  }

  isBot(player: Player): boolean {
    return this.findByOwner(player).length > 0;
  }

  deleteById(botId: string) {
    const bot = this.db.findById(botId);
    if (bot) {
      this.db.deleteById(bot.id);
      this.onlineService.setOfflineById(bot.playerId);
      this.playerService.db.deleteById(bot.playerId);
    }
  }
}
