import type { Player } from "~/engine/core";
import { createItemKind } from "~/engine/core";

export const gold = createItemKind({
  name: "gold",
  label: "Gold",
  inspection: "Shiny shiny gold. It's the currency of this world.",
  stackable: true,
});

export const honey = createItemKind({
  name: "honey",
  label: "Honey",
  consumeMethod: "eat",
  effects: [["Health", 2]],
  consume: (player: Player) => [
    {
      ...player,
      currentHealth: Math.min(player.currentHealth + 2, player.health),
    },
    `${player.username} eats honey and regains 2 health.`,
  ],
  inspection: "Why do bees drop a full jar of honey?",
  stackable: true,
});

export const bee_sting_poison = createItemKind({
  name: "bee_sting_poison",
  label: "Poisonous bee sting",
  effects: [
    ["Attack", 2],
    ["Intelligence", 2],
  ],
  inspection: "A sting that belonged to a bee, poison is dripping from it.",
  stackable: false,
  equipSlot: "attack",
});

export const bee_sting = createItemKind({
  name: "bee_sting",
  label: "Bee sting",
  inspection:
    "A sting that belonged to a bee, it looks pointy. It doesn't have any poison in it.",
  effects: [["Attack", 1]],
  stackable: false,
  equipSlot: "attack",
});

export const bones = createItemKind({
  name: "bones",
  label: "Bones",
  inspection: "Some bones, it belonged to an animal.",
  stackable: true,
});

export const crab_shell = createItemKind({
  name: "crab_shell",
  label: "Bones",
  inspection: "A shiny crab shell, it looks very hard and sturdy.",
  stackable: false,
});
