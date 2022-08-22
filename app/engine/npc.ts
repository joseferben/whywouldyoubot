import { Item } from "./item";

type Combat = {
  health: [number, number];
  attack: [number, number];
  intelligence: [number, number];
  defense: [number, number];
};

type AmountRange = [number, number];

export type Npc = {
  name: string;
  image: string;
  combat: Combat;
  dropTable: [Item, AmountRange, number][];
};
