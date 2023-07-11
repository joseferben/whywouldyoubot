import type { ServerEvent } from "@wwyb/core";
import type { State } from "./store";

function setState(state: State, se: ServerEvent) {
  if (se.state.actions) {
    state.actions = se.state.actions;
  }
  if (se.state.ground) {
    state.ground = se.state.ground;
  }
  if (se.state.npcs) {
    state.npcs = se.state.npcs;
  }
  if (se.state.players) {
    state.players = new Map(se.state.players.map((p) => [p.id, p]));
  }
  if (se.state.inventory) {
    state.inventory = se.state.inventory;
  }
  if (se.state.droppedItems) {
    state.droppedItems = se.state.droppedItems;
  }
}

export function handleEvent(state: State, se: ServerEvent) {
  setState(state, se);
  if (se.event.tag === "playerStepped") {
    if (!se.event.lastStep) {
      state.animations.set(se.event.playerId, "walk");
    } else {
      state.animations.delete(se.event.playerId);
    }
  } else {
    console.error("unknown event", event);
  }
  return state;
}
