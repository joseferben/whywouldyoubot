import { ItemKind } from "./item";

type Combat = {
  health: [number, number];
  attack: [number, number];
  intelligence: [number, number];
  defense: [number, number];
};

type AmountRange = [number, number];

export type NpcKind = {
  name: string;
  label: string;
  image: string;
  combat: Combat;
  dropTable: [ItemKind, AmountRange, number][];
};

export type NpcKindMap = { [k: string]: NpcKind };
