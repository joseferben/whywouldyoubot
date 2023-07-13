import { EntityDB } from "@wwyb/entitydb";
import type { JSONStore } from "@wwyb/entitydb";
import { initOnce } from "~/utils";
import { validateName, type Bot, type Player } from "@wwyb/core";
import { customAlphabet } from "nanoid";

export class BotService {
  db!: EntityDB<Bot>;
  constructor(readonly jsonStore: JSONStore) {
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

  create(name: string, player: Player): Bot | string {
    const nameValidation = validateName(name);
    if (nameValidation) return nameValidation;
    if (this.db.findBy("name", name).length > 0) return "Name already taken";

    return this.db.create({
      name,
      ownerId: player.id,
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
