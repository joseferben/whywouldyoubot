import * as npcKinds from "./npc";
import * as itemKinds from "./item";
import * as resourceKinds from "./resource";

export type Player = {
  id: string;
  userId: string;
  username: string;
  x: number;
  y: number;
  xp: number;
  currentHealth: number;
  // combat skills
  health: number;
  attack: number;
  intelligence: number;
  defense: number;
  // trade skills,

  hunting: number;
  trading: number;
  cooking: number;
  farming: number;
  fishing: number;
  // slots

  leftHand: string | null;
  neck: string | null;
  head: string | null;
  rightHand: string | null;
  torso: string | null;
  legs: string | null;
  feet: string | null;
  // avatar

  avatarHead: number;
  avatarEyes: number;
  avatarHair: number;
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
  me: string;
  actions: PotentialAction[];
  ground: WorldMapTile[];
  npcs: Npc[];
  inventory: Item[];
  droppedItems: DroppedItem[];
  players: Map<string, Player>;
};

export type SerializedClientState = Omit<
  Omit<Partial<ClientState>, "me">,
  "players"
> & { players: Player[] };

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