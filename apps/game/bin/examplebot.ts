import { Bot } from "@wwyb/sdk";

if (!process.env.API_KEY) throw new Error("API_KEY not set");

const bot = new Bot({
  baseUrl: "http://localhost:3000",
  apiKey: process.env.API_KEY,
});

bot.act(async (state) => {
  const { x, y } = state.me;
  const xRandom = Math.random() > 0.5 ? 1 : -1;
  const yRandom = Math.random() > 0.5 ? 1 : -1;
  const target = { x: x + xRandom, y: y + yRandom };
  console.log("walking to", target);
  return bot.walkTo(target);
});
