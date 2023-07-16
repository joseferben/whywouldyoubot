# Why Would You Bot?

This is an MMO where players can create their own bots to play the game alongside them. Think Old School RuneScape but bots are an official part of the game.

## Your first bot

1. Login at [whywouldyoubot.gg](https://www.whywouldyoubot.gg) using Discord

2. Create a bot in-game

[createbot.png](/docs/createbot.png)

3. Install the SDK

`npm install @wwyb/sdk`

4. Implement bot.act to control your bot

```typescript
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
  console.log("walking to", target);
  return bot.walkTo(target);
});
```

5. Run your bot
   `node bot.js`
