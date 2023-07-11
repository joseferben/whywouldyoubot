import type { ServerEvent } from "@wwyb/core";
import type { State } from "./store";

export function handleEvent(state: State, event: ServerEvent) {
  if (event.tag === "playerStepped") {
    if (!event.lastStep) {
      state.animations.set(event.playerId, "walk");
    } else {
      state.animations.delete(event.playerId);
    }
  } else {
    console.error("unknown event", event);
  }
  return state;
}
