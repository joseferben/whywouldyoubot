import { Bot } from "@wwyb/sdk";

const bot = new Bot({ baseUrl: "http://localhost:3000", apiKey: "" });

bot.act(async (state) => {
  const { x, y } = state.me;
  const xRandom = Math.random() > 0.5 ? 1 : -1;
  const yRandom = Math.random() > 0.5 ? 1 : -1;
  return bot.walkTo({ x: x + xRandom, y: y + yRandom });
});
