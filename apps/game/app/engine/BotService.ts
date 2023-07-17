import { EntityDB } from "@wwyb/entitydb";
import type { JSONStore } from "@wwyb/entitydb";
import { initOnce } from "~/utils";
import { type Bot, type Player } from "@wwyb/core";
import { customAlphabet } from "nanoid";
import { validateName, type PlayerService } from "./PlayerService";

export class BotService {
  db!: EntityDB<Bot>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly playerService: PlayerService,
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

    const player = this.playerService.create(botName);
    if (typeof player === "string") return player;
    return this.db.create({
      name: botName,
      ownerId: owner.id,
      playerId: player.id,
      apiKey: customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890")(),
    });
  }

  findByOwner(player: Player): Bot[] {
    return this.db.findBy("ownerId", player.id);
  }

  isBot(player: Player): boolean {
    return this.findByOwner(player).length > 0;
  }
}
