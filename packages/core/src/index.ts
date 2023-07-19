import * as npcKinds from "./npc";
import * as itemKinds from "./item";
import * as resourceKinds from "./resource";

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

type State = {
  tag: "state";
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

export type Emoji = {
  id: number;
  path: string;
};

export type ShownEmoji = {
  id: string;
  playerId: string;
  emoji: Emoji;
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
  availableEmojis: Emoji[];
  shownEmojis: Map<string, ShownEmoji>;
};

export type SerializedClientState = Omit<
  Omit<Omit<Partial<ClientState>, "players">, "shownEmojis">,
  "me"
> & {
  me: Player;
  players?: Player[];
  shownEmojis?: ShownEmoji[];
};

export function deserializeClientState(
  state: SerializedClientState
): ClientState {
  return {
    me: state.me,
    actions: state.actions || [],
    ground: state.ground || [],
    npcs: state.npcs || [],
    inventory: state.inventory || [],
    droppedItems: state.droppedItems || [],
    players: new Map(state.players?.map((p) => [p.id, p])),
    availableEmojis: state.availableEmojis || [],
    shownEmojis: new Map(state?.shownEmojis?.map((e) => [e.playerId, e])),
  };
}

export type GameEvent = PlayerStepped | PlayerAttacked | State;

export type ServerEvent = {
  state: SerializedClientState;
  event: GameEvent;
};

type Walk = {
  tag: "walk";
  x: number;
  y: number;
};

type Hit = {
  tag: "hit";
};

export type Action = Walk | Hit;

export type PotentialAction = {
  action: Walk;
  label: string;
  disabled?: boolean;
};

export type PotentialActionMap = {
  actions: Partial<Record<Action["tag"], PotentialAction>>;
  default: Action["tag"];
};

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

export type Bot = {
  id: string;
  ownerId: string;
  playerId: string;
  apiKey: string;
  name: string;
};

export function respond(data: any): Response {
  if (typeof data === "object") {
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else if (typeof data === "string") {
    return new Response(JSON.stringify({ error: data }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else if (data === null || data === undefined) {
    return new Response(JSON.stringify(null), {
      status: 200,
    });
  } else {
    throw new Error(`Invalid response data: ${data}`);
  }
}

export async function responseToJson<T>(resp: Response): Promise<T | string> {
  if (resp.status === 200) {
    try {
      const data = await resp.json();
      return data;
    } catch (e) {
      throw new Error(`failed to parse response as json ${e}`);
    }
  } else if (resp.status === 400) {
    try {
      const json = await resp.json();
      if (json.error) {
        return json.error;
      } else {
        throw new Error(`request had status 400 but not error ${json}}`);
      }
    } catch (e) {
      throw new Error(`request failed with response ${resp.status} ${e}}`);
    }
  } else if (resp.status === 401) {
    throw new Error(
      "Invalid API key provided, make sure you copy paste it correctly."
    );
  } else {
    throw new Error(`unexpected response status ${resp.status} received`);
  }
}
