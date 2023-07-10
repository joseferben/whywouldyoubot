import type { ServerEvent } from "@wwyb/core";
import type { SetFunction, State } from "./store";

export function handleEvent(set: SetFunction, event: ServerEvent) {
  if (event.tag === "playerStepped") {
    set((state: State) => ({
      player: { ...state.player, x: event.x, y: event.y },
      playerWalking: !event.lastStep,
    }));
  } else {
    console.error("unknown event", event);
  }
}
