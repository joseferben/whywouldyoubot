import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import TiledMap, { TiledLayer, TiledObject, TiledTile } from "tiled-types";
import invariant from "tiny-invariant";
import * as npcKinds from "./content/npc";
import { createIndex } from "./index.server";
import { getNpcsByRect, spawnNpc } from "./models/npc.server";
import { array2d, pickRandom, Rectangle } from "./utils";

const TMX_FILE_DIR = "public/assets/map";
const TMX_FILE_PATH = `${TMX_FILE_DIR}/map.tmx`;
const tmxFile = fs.readFileSync(TMX_FILE_PATH);
const hashSum = crypto.createHash("md5");
hashSum.update(tmxFile);

const hash = hashSum.digest("base64url");

const JSON_FILE_PATH = `${TMX_FILE_DIR}/map.${hash}.json`;

const OBSTACLE_LAYER_NAME = "obstacle";
const NPC_SPAWN_LAYER_NAME = "npc_spawn";
const MAX_NPCS_PER_SPAWNER = 3;
const TILE_DIMENSION = 16;

type Tile = {
  description: string;
  imagePaths: string[];
  x: number;
  y: number;
  obstacle: boolean;
  gid: number;
};

type Map = {
  tiles: Tile[][];
};

declare global {
  var __map__: Map;
}

let map: Map;

function gidToTiledTile(gid: number, tiled: TiledMap): TiledTile | undefined {
  if (gid === 0) {
    return undefined;
  }
  const tilesets = tiled.tilesets
    .filter((t) => t.firstgid <= gid)
    .sort((a, b) => b.firstgid - a.firstgid);
  if (tilesets.length === 0) {
    return;
  }
  const tileset = tilesets[0];
  const localId = gid - tileset.firstgid;
  // if (gid === 77) {
  //   console.log(tileset);
  //   console.log(localId);
  // }
  if (tileset.tiles !== undefined) {
    return tileset.tiles.find((t) => t.id === localId);
  }
}

function isTiledTileObstacle(layer: TiledLayer, tiledTile: TiledTile): boolean {
  if (layer.name === OBSTACLE_LAYER_NAME) {
    return true;
  }
  const tiledProperty = (tiledTile.properties || []).find(
    (p) => p.name === "obstacle"
  );
  return tiledProperty ? tiledProperty.value === true : false;
}

function tiledObjectToRectangle(o: TiledObject): Rectangle {
  return {
    x: Math.round(o.x / TILE_DIMENSION),
    y: Math.round(o.y / TILE_DIMENSION),
    width: Math.round(o.width / TILE_DIMENSION),
    height: Math.round(o.height / TILE_DIMENSION),
  };
}

async function spawnNpcs(objects: TiledObject[]) {
  await createIndex();
  for (const spawner of objects) {
    console.log("spawn", spawner.name);
    const rec = tiledObjectToRectangle(spawner);
    // @ts-ignore
    const kind: npcKinds.Npc = npcKinds[spawner.name];
    if (kind) {
      const npcs = await getNpcsByRect(rec);
      if (npcs.length < MAX_NPCS_PER_SPAWNER) {
        const nToSpawn = MAX_NPCS_PER_SPAWNER - npcs.length;
        for (const pos of pickRandom(rec, nToSpawn)) {
          await spawnNpc(kind, pos.x, pos.y);
        }
      }
    }
  }
}

function mapOfTiledMap(tiledMap: TiledMap): Map {
  if (tiledMap.orientation !== "orthogonal") {
    throw new Error("Only orthogonal maps supported");
  }
  const tiles: Tile[][] = array2d(tiledMap.width, tiledMap.height);

  for (const layer of tiledMap.layers) {
    if (layer.type === "tilelayer") {
      console.log("process tile layer", layer.name);
      if (typeof layer.data !== "string") {
        for (const [idx, gid] of layer.data.entries()) {
          const x = idx % tiledMap.width;
          const y = Math.floor(idx / tiledMap.width);
          const tiledTile = gidToTiledTile(gid, tiledMap);
          if (tiledTile !== undefined) {
            const descriptionProp = (tiledTile.properties || []).find(
              (p) => p.name === "description"
            );
            const description =
              descriptionProp !== undefined
                ? String(descriptionProp.value)
                : "This is a description";
            if (!tiles[x][y]) {
              // Create tiled
              tiles[x][y] = {
                description,
                imagePaths: tiledTile.image ? [tiledTile.image] : [],
                x,
                y,
                obstacle: isTiledTileObstacle(layer, tiledTile),
                gid,
              };
            } else {
              // Update existing tile
              const hasImageAlready =
                tiles[x][y].imagePaths.find((i) => i === tiledTile.image) !==
                undefined;
              if (tiledTile.image && !hasImageAlready) {
                tiles[x][y].imagePaths.push(tiledTile.image);
              }
              // Set if obstacle
              tiles[x][y].obstacle =
                tiles[x][y].obstacle || isTiledTileObstacle(layer, tiledTile);
            }
          }
        }
      }
    } else if (layer.type === "objectgroup") {
      console.log("process object layer", layer.name);
      if (layer.name === NPC_SPAWN_LAYER_NAME) {
        spawnNpcs(layer.objects);
      }
    }
  }
  return { tiles };
}

function loadMap(): Map {
  console.log("load map");
  if (fs.existsSync(JSON_FILE_PATH) && !process.env.BYPASS_CACHE) {
    console.log("map found in cache, load cache");
    return mapOfTiledMap(JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8")));
  } else {
    console.log("map not found in cache");
    const jsonFiles = fs
      .readdirSync(TMX_FILE_DIR)
      .filter((file) => file.endsWith(".json"));
    jsonFiles.forEach((file) => fs.rmSync(`${TMX_FILE_DIR}/${file}`));
    execSync(`tiled --export-map json ${TMX_FILE_PATH} ${JSON_FILE_PATH}`);
    return mapOfTiledMap(JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8")));
  }
}

function sliceMap(
  map: Map,
  posX: number,
  posY: number,
  width: number,
  height: number
): Map {
  invariant(
    posX > Math.floor(width / 2),
    `can not slice map at (${posX}, ${posY})`
  );
  invariant(
    posY > Math.floor(height / 2),
    `can not slice map at (${posX}, ${posY})`
  );
  const tiles: Tile[][] = array2d(width, height);
  const fromX = Math.round(posX - width / 2);
  const toX = Math.round(posX + width / 2);
  const fromY = Math.round(posY - height / 2);
  const toY = Math.round(posY + height / 2);
  for (const [x, col] of map.tiles.slice(fromX, toX).entries()) {
    for (const [y, tile] of col.slice(fromY, toY).entries()) {
      // copy over
      tiles[x][y] = { ...tile };
    }
  }
  return { tiles };
}

const FORCE_RELOAD_ALWAYS = false;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  map = loadMap();
} else {
  if (FORCE_RELOAD_ALWAYS) {
    global.__map__ = loadMap();
  }
  if (!global.__map__) {
    global.__map__ = loadMap();
  }
  map = global.__map__;
}

invariant(map != undefined, "map can not be undefined");

export type { Map, Tile };
export { map, sliceMap };
