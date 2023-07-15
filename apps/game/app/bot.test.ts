import { redirect } from "@remix-run/node";
import type { Client } from "@wwyb/sdk";
import { Bot, catchRemixResponse } from "@wwyb/sdk";
import { describe, it } from "vitest";
import { action } from "~/routes/api.walk";
import { RemixTestClient } from "~/test/RemixTestClient";

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

  it.only("create bot with invalid api key", async () => {
    const testClient = new RemixTestClient() as unknown as Client;
    const bot = new Bot(testClient);
    await expect(async () => bot.onTick(async (state) => {})).rejects.toThrow();
  });
});
