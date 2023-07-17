import { describe, it } from "vitest";
import { container } from "~/container.server";
import { cleanContainer } from "~/test/cleanContainer";
import invariant from "tiny-invariant";

afterEach(() => {
  cleanContainer(container);
});

describe("BotService", () => {
  it.only("create, delete and find bot", async () => {
    const owner = container.playerService.create("foo", "userid");
    invariant(typeof owner === "object", "owner not found");
    const bot = container.botService.create("botname", owner);
    invariant(typeof bot === "object", "owner not found");
    container.botService.deleteById(bot.id);
    const players = container.playerService.db.findAll();
    expect(players).toHaveLength(1);
    const spatialPlayers = container.playerService.db.findByRectangle(
      0,
      0,
      1000,
      1000
    );
    expect(spatialPlayers).toHaveLength(1);
  });
});
