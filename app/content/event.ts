import { Event, observableEvent, publishEvent } from "~/engine/event.server";
import { Npc } from "~/engine/models/npc.server";
import { User } from "~/engine/models/user.server";

type Died = {
  type: "died";
  payload: { user: User };
};

export function publishDied(user: User) {
  publishEvent({
    type: "died",
    payload: { user: user },
  });
}

async function died(event: Died) {
  // TODO implement
}

type DamageDealt = {
  type: "damageDealt";
  payload: { actor: Npc; target: User; damage: number };
};

export function publishDamageDealt(npc: Npc, user: User, damage: number) {
  const event: DamageDealt = {
    type: "damageDealt",
    payload: { actor: npc, target: user, damage },
  };
  publishEvent(event);
}

async function damageDealt(event: DamageDealt) {
  // TODO implement
}

async function handleEvent(event: Event) {
  if (event.type === "died") {
    await died(event as Died);
  } else if (event.type === "damageDealt") {
    await damageDealt(event as DamageDealt);
  } else {
    console.warn(`can not handle event ${event}`);
  }
}

export async function handleEvents() {
  observableEvent.subscribe(
    (event: Event) => handleEvent(event),
    (error) => console.error(error)
  );
}
