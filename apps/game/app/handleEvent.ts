import type { ServerEvent } from "@wwyb/core";
import type { Actions, State } from "./store";
import type { Draft } from "immer";

export function handleEvent(
  state: Draft<State & Actions>,
  event: ServerEvent
): Draft<State & Actions> {
  if (event.tag === "playerStepped") {
    const player = state.players.getById(event.playerId);
    if (!event.lastStep) {
      state.characterAnimations.insert({
        id: event.playerId,
        animation: "walk",
      });
    } else {
      state.characterAnimations.deleteById(player.id);
    }
    player.x = event.x;
    player.y = event.y;
    state.players.update(player);
  } else {
    console.error("unknown event", event);
  }
  return state;
}
