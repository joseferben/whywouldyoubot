import { getNpc, Npc } from "~/engine/models/npc.server";
import {
    createTick,
    getTick,
    observable,
    Tick
} from "~/engine/models/tick.server";
import { getUser, User } from "~/engine/models/user.server";

async function hitNpc(user: User, npc: Npc) {}

async function hitUser(user: User, npc: Npc) {}

async function chop(tick: Tick) {
  throw new Error("implement chop()");
}

export async function processTick(tick: Tick) {
  console.debug(`handle tick ${JSON.stringify(tick)}`);
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
  await createTick(user.entityId, npc.entityId, "hitNpc", 0);
  // TODO only if there are no ticks already with this npc as actor
  await createTick(npc.entityId, user.entityId, "hitUser", 0);
}

export async function processTicks() {
  console.log("processTicks()");
  observable.subscribe(
    (tick) => {
      console.log(tick);
      try {
        const [type, id] = tick.split(":");
        if (type !== "Tick") {
          throw new Error(`unexpected tick received ${tick}`);
        }
        getTick(id).then(processTick);
      } catch (e) {
        console.error(`unexpected tick received ${tick}`);
      }
    },
    (err) => console.error(err)
  );
}
