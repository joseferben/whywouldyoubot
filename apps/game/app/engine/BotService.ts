import { EntityDB } from "@wwyb/entitydb";
import type { JSONStore } from "@wwyb/entitydb";
import { initOnce } from "~/utils";
import { validateName, type Bot, type Player } from "@wwyb/core";
import { customAlphabet } from "nanoid";
import type { PlayerService } from "./PlayerService";

export class BotService {
  db!: EntityDB<Bot>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly playerService: PlayerService
  ) {
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<Bot>({
          fields: ["ownerId", "playerId", "name", "apiKey"],
          jsonStore,
          persistenceNamespace: "bot",
        })
    );
  }

  create(botName: string, owner: Player): Bot | string {
    const nameValidation = validateName(botName);
    if (nameValidation) return nameValidation;
    if (this.db.findBy("name", botName).length > 0) return "Name already taken";

    const player = this.playerService.create(botName);
    if (typeof player === "string") return player;
    return this.db.create({
      name: botName,
      ownerId: owner.id,
      playerId: player.id,
      apiKey: customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890")(),
    });
  }

  findByPlayer(player: Player): Bot[] {
    return this.db.findBy("playerId", player.id);
  }

  isBot(player: Player): boolean {
    return this.findByPlayer(player).length > 0;
  }
}
