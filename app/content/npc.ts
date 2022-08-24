import { NpcKind } from "~/engine/npc";
import { bones, gold, honey } from "./item";

export const bee: NpcKind = {
  name: "bee",
  label: "Bee",
  image: "assets/npcs/bee.png",
  combat: {
    health: [5, 5],
    attack: [2, 3],
    intelligence: [1, 1],
    defense: [1, 3],
  },
  dropTable: [
    [honey, [1, 1], 0.25],
    [gold, [5, 10], 50],
  ],
};

export const wolf: NpcKind = {
  name: "wolf",
  label: "Wolf",
  image: "assets/npcs/wolf.png",
  combat: {
    health: [10, 15],
    attack: [4, 5],
    intelligence: [2, 3],
    defense: [2, 4],
  },
  dropTable: [
    [bones, [1, 1], 0.25],
    [gold, [5, 10], 50],
  ],
};
