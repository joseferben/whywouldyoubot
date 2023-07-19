import { Bot } from '@wwyb/sdk'
import type { Player } from '@wwyb/core'

if (!process.env.API_KEY) throw new Error("API_KEY not set");

const bot = new Bot({
  apiKey: process.env.API_KEY,
})

bot.act(async (state) => {
  const {
    me,
    players,
  } = state

  let closest = {
    player: null as Player | null,
    distance: Infinity,
  }
  players.forEach((player) => {
    if (player.id === me.id) return
    const { x, y } = player
    const distance = Math.sqrt(
      Math.pow(x - me.x, 2) + Math.pow(y - me.y, 2),
    )
    if (distance < closest.distance) {
      closest = { player: player, distance }
    }
  })
  if (!closest.player) return

    console.log(`I'm best friends with ${closest.player.username}!`)
    const { x, y } = closest.player
    await bot.walkTo({ x: x + 1, y })

})
