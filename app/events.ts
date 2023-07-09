import type { ClientEvent } from "./engine/ClientEventService";
import type { SetFunction, State } from "./store";

export function handleEvent(set: SetFunction, event: ClientEvent) {
  if (event.tag === "playerStepped") {
    set((state: State) => ({
      player: { ...state.player, x: event.x, y: event.y },
      playerWalking: !event.lastStep,
    }));
  } else {
    console.error("unknown event", event);
  }
}
