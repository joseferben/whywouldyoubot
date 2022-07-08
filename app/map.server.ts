import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import TiledMap from "tiled-types";
import invariant from "tiny-invariant";

const TMX_FILE_DIR = "public/assets/map";
const TMX_FILE_PATH = `${TMX_FILE_DIR}/map.tmx`;
const tmxFile = fs.readFileSync(TMX_FILE_PATH);
const hashSum = crypto.createHash("md5");
hashSum.update(tmxFile);

const hash = hashSum.digest("base64url");

const jsonFilePath = `${TMX_FILE_DIR}/map.${hash}.json`;

let map: TiledMap;

declare global {
  var __map__: TiledMap;
}

function loadMap(): TiledMap {
  console.log("load map");
  if (fs.existsSync(jsonFilePath)) {
    return JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
  } else {
    const jsonFiles = fs
      .readdirSync(TMX_FILE_DIR)
      .filter((file) => file.endsWith(".json"));
    jsonFiles.forEach((file) => fs.rmSync(`${TMX_FILE_DIR}/${file}`));
    execSync(`tiled --export-map json ${TMX_FILE_PATH} ${jsonFilePath}`);
    return JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
  }
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === "production") {
  map = loadMap();
} else {
  if (!global.__map__) {
    global.__map__ = loadMap();
  }
  map = global.__map__;
}

invariant(map != undefined, "map can not be null");

export { map };
