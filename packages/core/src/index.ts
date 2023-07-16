import * as npcKinds from "./npc";
import * as itemKinds from "./item";
import * as resourceKinds from "./resource";

import Filter from "bad-words";

// TODO think about splitting up core type
// client player needs to know a bit more than core though
export type Player = {
  id: string;
  userId: string | null;
  username: string;
  x: number;
  y: number;
  xp: number;
  currentHealth: number;

  // CombatSkillService
  health: number;
  attack: number;
  intelligence: number;
  defense: number;

  // TradeSkillService
  hunting: number;
  trading: number;
  cooking: number;
  farming: number;
  fishing: number;

  // EquipmentService
  leftHand: string | null;
  neck: string | null;
  head: string | null;
  rightHand: string | null;
  torso: string | null;
  legs: string | null;
  feet: string | null;

  // avatar
  // CharacterCustimizationService
  avatarHead: number | null;
  avatarEyes: number | null;
  avatarHair: number | null;
};

export type CharacterCustomization = {
  head: number;
  eyes: number;
  hair: number;
};

export type Item = {
  id: string;
  kind: string;
  amount: number;
  playerId: string;
  bank: boolean;
};

export type DroppedItem = {
  id: string;
  amount: number;
  kind: string;
  x: number;
  y: number;
};

export type Npc = {
  id: string;
  kind: string;
  currentHealth: number;
  health: number;
  attack: number;
  intelligence: number;
  defense: number;
  x: number;
  y: number;
  lastActedAt?: number;
};

export type Config = {
  logoutTimeoutMs: number;
  resources: { [k: string]: ResourceKind };
  npcs: { [k: string]: NpcKind };
  items: { [k: string]: ItemKindOpts };
  obstacleLayerName: string;
  assetsPath: string;
  mapPath: string;
  miniMapWidth: number;
  miniMapHeight: number;
  spawnX: number;
  spawnY: number;
  spawnLayerName: string;
  maxNpcsPerSpawner: number;
  spawnRateMs: number;
};

export type ResourceKind = {
  image: string;
  name: string;
  label: string;
  amount: number;
};
export type ResourceKindMap = { [k: string]: ResourceKind };

export type CombatStat = "Health" | "Attack" | "Defense" | "Intelligence";

export type Effect = [CombatStat, number];

export type EquipSlot = "attack" | "intelligence" | "defense";

type Combat = {
  health: [number, number];
  attack: [number, number];
  intelligence: [number, number];
  defense: [number, number];
};

export type ItemKindOpts = {
  name: string;
  label: string;
  consumeMethod?: "eat" | "drink";
  consume?: (player: Player) => [Player, string];
  effects?: Effect[];
  inspection: string;
  stackable: boolean;
  equipSlot?: EquipSlot;
};

export class ItemKind {
  name: string;
  label: string;
  consumeMethod: "eat" | "drink";
  consume: (player: Player) => [Player, string];
  effects: Effect[];
  inspection: string;
  stackable: boolean;
  equipSlot: EquipSlot;
  constructor(opts: ItemKindOpts) {
    this.name = opts.name;
    this.label = opts.label;
    this.consumeMethod = opts.consumeMethod || "eat";
    this.consume = opts.consume || ((player) => [player, ""]);
    this.effects = opts.effects || [];
    this.inspection = opts.inspection;
    this.stackable = opts.stackable;
    this.equipSlot = opts.equipSlot || "attack";
  }
}

export function createItemKind(opts: ItemKindOpts) {
  return opts;
}

type AmountRange = [number, number];

export type DropTable = [ItemKindOpts, AmountRange, number][];

export type NpcKind = {
  name: string;
  label: string;
  image: string;
  combat: Combat;
  dropTable: DropTable;
  inspection: string;
  xp: number;
};

export type NpcKinds = { [k: string]: NpcKind };

type PlayerStepped = {
  tag: "playerStepped";
  playerId: string;
  x: number;
  y: number;
  lastStep?: boolean;
};

type PlayerAttacked = {
  tag: "playerAttacked";
  characterId: string;
};

export type WorldMapTile = {
  description: string;
  imagePaths: string[];
  x: number;
  y: number;
  obstacle: boolean;
  gid: number;
  id: string;
};

export type ClientState = {
  // playerId of current player
  me: Player;
  actions: PotentialAction[];
  ground: WorldMapTile[];
  npcs: Npc[];
  inventory: Item[];
  droppedItems: DroppedItem[];
  players: Map<string, Player>;
};

export type SerializedClientState = Omit<
  Omit<Partial<ClientState>, "players">,
  "me"
> & {
  me: Player;
  players?: Player[];
};

export type GameEvent = PlayerStepped | PlayerAttacked;

export type ServerEvent = {
  state: SerializedClientState;
  event: GameEvent;
};

type Walk = {
  tag: "walk";
  x: number;
  y: number;
};

export type Action = Walk;

export type PotentialAction = Walk;

export function getResourceKind(name: string): ResourceKind | null {
  // @ts-ignore
  return resourceKinds[name];
}

export function getNpcKinds(): NpcKinds {
  // @ts-ignore
  return npcKinds;
}

export function getNpcKind(name: string): NpcKind | null {
  // @ts-ignore
  return npcKinds[name];
}

export function getItemKinds(): { [name: string]: ItemKindOpts } {
  // @ts-ignore
  return itemKinds;
}

export function getItemKind(name: string): ItemKindOpts | null {
  // @ts-ignore
  return itemKinds[name];
}

export function validateName(name: string | undefined): string | null {
  if (!name) {
    return "Name is required";
  }
  if (name.length < 3) {
    return "Name must be at least 3 characters long";
  }

  if (name.length > 20) {
    return "Name must be at most 20 characters long";
  }

  const filter = new Filter();
  if (filter.isProfane(name)) {
    return "Use a different name";
  }

  return null;
}

export type Bot = {
  id: string;
  ownerId: string;
  playerId: string;
  apiKey: string;
  name: string;
};
