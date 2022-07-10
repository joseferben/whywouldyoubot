import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import TiledMap, { TiledTile } from "tiled-types";
import invariant from "tiny-invariant";

const TMX_FILE_DIR = "public/assets/map";
const TMX_FILE_PATH = `${TMX_FILE_DIR}/map.tmx`;
const tmxFile = fs.readFileSync(TMX_FILE_PATH);
const hashSum = crypto.createHash("md5");
hashSum.update(tmxFile);

const hash = hashSum.digest("base64url");

const JSON_FILE_PATH = `${TMX_FILE_DIR}/map.${hash}.json`;

const OBSTACLE_LAYER_NAME = "obstacle";

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

function mapOfTiledMap(tiledMap: TiledMap): Map {
  if (tiledMap.orientation !== "orthogonal") {
    throw new Error("Only orthogonal maps supported");
  }
  const tiles: Tile[][] = Array.from(
    Array(tiledMap.width),
    () => new Array(tiledMap.height)
  );

  for (const layer of tiledMap.layers) {
    if (layer.type === "tilelayer") {
      console.log("process tile layer", layer.name);
      if (typeof layer.data !== "string") {
        for (const [idx, gid] of layer.data.entries()) {
          const x = idx % tiledMap.width;
          const y = Math.floor(idx / tiledMap.width);
          const tiledTile = gidToTiledTile(gid, tiledMap);
          if (
            layer.name === OBSTACLE_LAYER_NAME &&
            gid !== 0 &&
            x === 548 &&
            y === 558
          ) {
            // console.log(x, y, gid);
            // console.log(tiledTile);
          }
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
                obstacle: layer.name === OBSTACLE_LAYER_NAME,
                gid,
              };
            } else {
              // Update existing tile
              if (tiledTile.image) {
                tiles[x][y].imagePaths.push(tiledTile.image);
              }
              // Set if obstacle
              tiles[x][y].obstacle =
                tiles[x][y].obstacle || layer.name === OBSTACLE_LAYER_NAME;
            }
          }
        }
      }
    } else if (layer.type === "objectgroup") {
      console.log("process object layer", layer.name);
    }
  }
  return { tiles };
}

function loadMap(): Map {
  console.log("load map");
  if (fs.existsSync(JSON_FILE_PATH)) {
    return mapOfTiledMap(JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8")));
  } else {
    const jsonFiles = fs
      .readdirSync(TMX_FILE_DIR)
      .filter((file) => file.endsWith(".json"));
    jsonFiles.forEach((file) => fs.rmSync(`${TMX_FILE_DIR}/${file}`));
    execSync(`tiled --export-map json ${TMX_FILE_PATH} ${JSON_FILE_PATH}`);
    return mapOfTiledMap(JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8")));
  }
}

export { map };

const FORCE_RELOAD = true;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  map = loadMap();
} else {
  if (FORCE_RELOAD) {
    global.__map__ = loadMap();
  }
  if (!global.__map__) {
    global.__map__ = loadMap();
  }
  map = global.__map__;
}

invariant(map != undefined, "map can not be undefined");
