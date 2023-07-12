import { EntityDB } from "@wwyb/entitydb";
import type { JSONStore } from "@wwyb/entitydb";
import type { PlayerService } from "./PlayerService";
import { initOnce } from "~/utils";
import { validateName, type Bot, type Player } from "@wwyb/core";

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
          fields: ["ownerId", "playerId"],
          jsonStore,
          persistenceNamespace: "bot",
        })
    );
  }

  create(name: string, player: Player): Bot | string {
    const nameValidation = validateName(name);
    if (nameValidation) return nameValidation;

    return this.db.create({
      name,
      ownerId: player.id,
      playerId: player.id,
      apiKey: "123",
    });
  }

  findByPlayer(player: Player): Bot[] {
    return this.db.findBy("playerId", player.id);
  }
}
