import { Action, registerActionHandler } from "~/engine/models/action.server";
import { getNpc, hitUser } from "~/engine/models/npc.server";
import { getUserOrThrow } from "~/engine/models/user.server";
import { pickRandom } from "~/utils";

async function attack(action: Action) {
  const npc = await getNpc(action.thingId);
  const users = await Promise.all(action.userIds.map(getUserOrThrow));
  if (npc.canHit()) {
    // npc hits random user
    const user = pickRandom(users);
    await hitUser(npc, user);
  }
  const hittingUsers = users.filter((user) => user.canAct());
  // all users that can hit, hit
  await Promise.all(hittingUsers.map((user) => user.hit(npc)));
  const nextHitInMS = 50;
  setTimeout(() => attack(action), nextHitInMS);
}

async function chop(action: Action) {
  return Promise.resolve();
}

registerActionHandler("attack", attack);
registerActionHandler("chop", chop);
