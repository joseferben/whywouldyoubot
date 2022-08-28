import { chat } from "~/engine/chat.server";
import { Npc } from "~/engine/models/npc.server";
import { User } from "~/engine/models/user.server";
import { refresher } from "~/engine/refresher.server";

export async function userDied(user: User) {
  await chat.local(`${user.name} died`, user.posX, user.posY);
  await Promise.all([refresher.at(user.posX, user.posY), refresher.user(user)]);
}

export async function damageDealt(npc: Npc, user: User, damage: number) {
  await chat.local(
    `${user.name} hit ${npc} and dealt ${damage} damage`,
    user.posX,
    user.posY
  );
  await Promise.all([refresher.at(user.posX, user.posY)]);
}
