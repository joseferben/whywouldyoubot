import { Bot } from "@wwyb/sdk";
import invariant from "tiny-invariant";
import { RemixTestClient } from "./RemixTestClient";
import { container } from "~/container.server";

export function testBot(): Bot {
  const player = container.playerService.create("player", "someUserId");
  invariant(typeof player === "object", player as string);
  const maybeBot = container.botService.create("name", player);
  invariant(typeof maybeBot === "object", maybeBot as string);
  const testClient = new RemixTestClient({ apiKey: maybeBot.apiKey });
  return new Bot(testClient);
}
