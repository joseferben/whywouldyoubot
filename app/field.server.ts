import { User } from "./models/user.server";

type Player = { name: string; img: string };
type Action = { name: string; disabled: boolean };

export type Interactive = {
  id: number;
  img: string;
  name: string;
  actions: Action[];
  players: Player[];
};

export type Item = {
  id: number;
  img: string;
  name: string;
  canPickUp: boolean;
};

export type Field = { description: string; region: string; location: string };

export async function getInteractives(user: User): Promise<Interactive[]> {
  const interactive1 = {
    id: 1,
    img: "assets/npcs/cow.png",
    name: "Cow (3)",
    inAction: true,
    actions: [{ name: "Attack", disabled: false }],
    players: [],
  };
  const interactive2 = {
    id: 2,
    img: "assets/npcs/cow.png",
    name: "Cow (2)",
    inAction: false,
    actions: [],
    players: [
      { name: "dragonslayer234", img: "assets/avatars/1.png" },
      { name: "dragonkiller1", img: "assets/avatars/2.png" },
    ],
  };
  const interactive3 = {
    id: 3,
    img: "assets/tiles/location/tree_1.png",
    name: "Tree",
    inAction: false,
    actions: [{ name: "Cut", disabled: false }],
    players: [{ name: "killer33", img: "assets/avatars/3.png" }],
  };

  return [interactive1, interactive2, interactive3];
}

export async function getItems(user: User): Promise<Item[]> {
  const item1 = {
    id: 1,
    name: "Honey",
    img: "assets/items/honey.png",
    canPickUp: true,
  };
  const item2 = {
    id: 2,
    name: "Crab Shell",
    img: "assets/items/crab_shell.png",
    canPickUp: true,
  };
  return [item1, item2];
}

export async function getField(user: User): Promise<Field> {
  return {
    description: "You feel the sun shining on your neck.",
    region: "Clearview",
    location: "Meadows",
  };
}