import { Bot } from "@wwyb/sdk";

if (!process.env.API_KEY) throw new Error("API_KEY not set");

const bot = new Bot({
  apiKey: process.env.API_KEY,
});

bot.act(async (state) => {
  const { x, y } = state.me;
  const xRandom = Math.random() > 0.5 ? 2 : -2;
  const yRandom = Math.random() > 0.5 ? 2 : -2;
  const target = { x: x + xRandom, y: y + yRandom };
  return bot.walkTo(target);
});
