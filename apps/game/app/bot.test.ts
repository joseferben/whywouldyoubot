import { redirect } from "@remix-run/node";
import { Bot, catchRemixResponse } from "@wwyb/sdk";
import { describe, it } from "vitest";
import { action } from "~/routes/api.walk";
import { RemixTestClient } from "~/test/RemixTestClient";
import { container } from "~/container.server";
import type { ClientState } from "@wwyb/core";
import { cleanContainer } from "~/test/cleanContainer";
import { testBot } from "~/test/testBot";

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
    expect(clientState?.players).toHaveLength(2);
  });
});
