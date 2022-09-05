import { getNpc, Npc } from "~/engine/models/npc.server";
import {
    createTick,
    deleteTick,
    getTickByActor,
    observable,
    Tick
} from "~/engine/models/tick.server";
import { getUser, User } from "~/engine/models/user.server";

async function hitNpc(user: User, npc: Npc) {
  console.log(`user ${user.entityId} hits npc ${npc.entityId}`);
}

async function hitUser(user: User, npc: Npc) {
  console.log(`npc ${npc.entityId} hits user ${user.entityId}`);
}

export async function processTick(tick: Tick) {
  console.debug(`process tick ${JSON.stringify(tick)}`);
  if (tick.name === "hitNpc") {
    const user = await getUser(tick.actorId);
    const npc = await getNpc(tick.targetId);
    await hitNpc(user, npc);
  } else if (tick.name === "hitUser") {
    const user = await getUser(tick.actorId);
    const npc = await getNpc(tick.targetId);
    await hitUser(user, npc);
  } else {
    throw new Error(`can't handle tick ${tick.name}, don't know how`);
  }
}

export async function attack(user: User, npc: Npc) {
  await createTick(user.entityId, npc.entityId, "hitNpc");
  const tick = await getTickByActor(npc.entityId);
  if (!tick) {
    await createTick(npc.entityId, user.entityId, "hitUser");
  }
}

export async function processTicks() {
  console.log("processTicks()");
  observable.subscribe(
    (tick) => {
      try {
        // TODO consider rescheduling tick if fails
        processTick(tick).then(() => deleteTick(tick));
      } catch (e) {
        console.error(`unexpected tick received ${tick}`);
      }
    },
    (err) => console.error(err)
  );
}
