import type { NpcKind } from "~/engine/core";
import { bee_sting, bee_sting_poison, bones, gold, honey } from "./item";

export const bee: NpcKind = {
  name: "bee",
  label: "Bee",
  image: "assets/npcs/bee.png",
  combat: {
    health: [2, 3],
    attack: [1, 1],
    intelligence: [1, 1],
    defense: [1, 1],
  },
  dropTable: [
    [honey, [1, 1], 0.75],
    [bee_sting, [1, 1], 0.25],
    [bee_sting_poison, [1, 1], 0.1],
    [gold, [1, 3], 0.3],
  ],
  inspection: "A small bee is flying circles in the air.",
  xp: 2,
};

export const wolf: NpcKind = {
  name: "wolf",
  label: "Wolf",
  image: "assets/npcs/wolf.png",
  combat: {
    health: [10, 15],
    attack: [2, 5],
    intelligence: [2, 3],
    defense: [2, 4],
  },
  dropTable: [
    [bones, [1, 1], 0.25],
    [gold, [2, 4], 0.5],
  ],
  inspection: "This wolf looks angry.",
  xp: 10,
};
