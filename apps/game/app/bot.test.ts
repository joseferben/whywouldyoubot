import { redirect } from "@remix-run/node";
import { Bot, catchRemixResponse } from "@wwyb/sdk";
import { describe, it } from "vitest";
import { action } from "~/routes/api.walk";
import { RemixTestClient } from "~/test/RemixTestClient";
import type { Container } from "./container.server";
import { container } from "./container.server";
import invariant from "tiny-invariant";
import type { ClientState } from "@wwyb/core";

/**
 * Reset the state of the container for tests.
 */
function cleanContainer(container: Container) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Don't clean in production");
  // no need to clean MapService since it's mostly static
  container.playerService.db.entities = new Map();
  container.itemService.db.entities = new Map();
  container.clientEventService.db.entities = new Map();
  container.onlineService.db.entities = new Map();
  container.botService.db.entities = new Map();
  // container.npcService.db.close();
  // container.equipmentService.db.close();
  // container.avatarService.db.close();
  // container.combatStatsService.db.close();
  // container.inventoryService.db.close();
  // container.spawnService.db.close();
  // container.combatService.db.close();
}

function testBot(): Bot {
  const player = container.playerService.create("player", "someUserId");
  invariant(typeof player === "object", player as string);
  const maybeBot = container.botService.create("name", player);
  invariant(typeof maybeBot === "object", maybeBot as string);
  const testClient = new RemixTestClient({ apiKey: maybeBot.apiKey });
  return new Bot(testClient);
}

beforeEach(() => {
  cleanContainer(container);
});

describe("bot", () => {
  it("request without authentication", async () => {
    const body = JSON.stringify({ x: 1 });
    const request = new Request("https://something/api/walk", {
      method: "POST",
      body,
    });

    const response = await catchRemixResponse(() =>
      action({ request, context: {}, params: {} })
    );

    expect(response).toEqual(redirect("/login"));
    expect(response.status).toEqual(302);
  });

  it("create with invalid api key", async () => {
    const testClient = new RemixTestClient({ apiKey: "invalid" });
    const bot = new Bot(testClient);
    await expect(() => bot.onTick(async (state) => {})).rejects.toThrow();
  });

  it("get state", async () => {
    let clientState: ClientState | undefined;
    const bot = testBot();
    await bot.onTick(async (state) => {
      clientState = state;
    });
    expect(clientState).toBeDefined();
  });
});
