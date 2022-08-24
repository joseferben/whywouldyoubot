import TiledMap, { TiledObject } from "tiled-types";
import { NpcKind, NpcKinds } from "~/engine/npc";
import { getNpcsByRect, spawnNpc } from "../models/npc.server";
import { pickRandom, Rectangle } from "../utils";
import { map } from "./map.server";

const NPC_SPAWN_LAYER_NAME = "npc_spawn";
const MAX_NPCS_PER_SPAWNER = 3;
const TILE_DIMENSION = 16;

function tiledObjectToRectangle(o: TiledObject): Rectangle {
  return {
    x: Math.round(o.x / TILE_DIMENSION),
    y: Math.round(o.y / TILE_DIMENSION),
    width: Math.round(o.width / TILE_DIMENSION),
    height: Math.round(o.height / TILE_DIMENSION),
  };
}

async function spawnNpcsOfSpawners(
  objects: TiledObject[],
  npcKindMap: NpcKinds
) {
  for (const spawner of objects) {
    console.log("spawn", spawner.name);
    const rec = tiledObjectToRectangle(spawner);
    const kind: NpcKind = npcKindMap[spawner.name];
    if (kind) {
      const npcs = await getNpcsByRect(rec, kind);
      if (npcs.length < MAX_NPCS_PER_SPAWNER) {
        const nToSpawn = MAX_NPCS_PER_SPAWNER - npcs.length;
        for (const pos of pickRandom(rec, nToSpawn)) {
          await spawnNpc(kind, pos.x, pos.y);
        }
      }
    }
  }
}

async function spawnNpcs(tiledMap: TiledMap, npcKindMap: NpcKinds) {
  if (tiledMap.orientation !== "orthogonal") {
    throw new Error("Only orthogonal maps supported");
  }

  for (const layer of tiledMap.layers) {
    if (layer.type === "objectgroup") {
      if (layer.name === NPC_SPAWN_LAYER_NAME) {
        await spawnNpcsOfSpawners(layer.objects, npcKindMap);
      }
    }
  }
}

export async function spawn(npcKinds: NpcKinds) {
  await spawnNpcs(map.tiledMap, npcKinds);
}
