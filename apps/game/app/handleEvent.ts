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
  if (se.state.availableEmojis) {
    state.availableEmojis = se.state.availableEmojis;
  }
  if (se.state.shownEmojis) {
    state.shownEmojis = new Map(
      se.state.shownEmojis.map((e) => [e.playerId, e])
    );
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
  } else if (se.event.tag !== "state") {
    console.error("unknown event", se.event);
  }
  return state;
}
