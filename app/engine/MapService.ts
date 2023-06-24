import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import type { TiledLayer, TiledTile } from "tiled-types";
import type TiledMap from "tiled-types";
import invariant from "tiny-invariant";
import { getResourceKind } from "~/pure/content";
import type { ResourceKind } from "~/pure/engine/core";
import { array2d } from "~/pure/engine/math";
import type { WorldDB } from "./TransientDB";

// TODO use EntityDB with inmemory sqlite
export type Tile = {
  description: string;
  imagePaths: string[];
  x: number;
  y: number;
  obstacle: boolean;
  gid: number;
};

export type Map = {
  tiles: Tile[][];
  tiledMap: TiledMap;
};

export class MapService {
  map: Map | undefined;
  jsonFilePath: string;
  tmxFilePath: string;
  tmxFileDir: string;

  constructor(
    readonly db: WorldDB,
    readonly obstacleLayerName: string,
    mapPath: string
  ) {
    this.obstacleLayerName = obstacleLayerName;
    this.tmxFileDir = mapPath;
    this.tmxFilePath = `${this.tmxFileDir}/map.tmx`;
    const tmxFile = fs.readFileSync(this.tmxFilePath);
    const hashSum = crypto.createHash("md5");
    hashSum.update(tmxFile);
    const hash = hashSum.digest("base64url");
    this.jsonFilePath = `${this.tmxFileDir}/map.${hash}.json`;
  }

  gidToTiledTile(gid: number, tiled: TiledMap): TiledTile | undefined {
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

    if (tileset.tiles !== undefined) {
      return tileset.tiles.find((t) => t.id === localId);
    }
  }

  private isTiledTileObstacle(
    layer: TiledLayer,
    tiledTile: TiledTile
  ): boolean {
    if (layer.name === this.obstacleLayerName) {
      return true;
    }
    const tiledProperty = (tiledTile.properties || []).find(
      (p) => p.name === "obstacle"
    );
    return tiledProperty ? tiledProperty.value === true : false;
  }

  isObstacle(x: number, y: number) {
    return this.getMap().tiles[x][y].obstacle;
  }

  getDescription(tiledTile: TiledTile): string {
    const descriptionProp = (tiledTile.properties || []).find(
      (p) => p.name === "description"
    );
    return descriptionProp !== undefined
      ? String(descriptionProp.value)
      : "This is a description";
  }

  getResourceKindOfTile(tiledTile: TiledTile): ResourceKind | null {
    const tiledProperty = (tiledTile.properties || []).find(
      (p) => p.name === "resource"
    );
    const resourceKindName =
      tiledProperty !== undefined ? String(tiledProperty.value) : null;
    return resourceKindName ? getResourceKind(resourceKindName) : null;
  }

  processTile(
    tiles: Tile[][],
    layer: TiledLayer,
    tiledTile: TiledTile,
    x: number,
    y: number,
    gid: number
  ) {
    const description = this.getDescription(tiledTile);
    if (!tiles[x][y]) {
      // Create tiled
      tiles[x][y] = {
        description,
        imagePaths: tiledTile.image ? [tiledTile.image] : [],
        x,
        y,
        obstacle: this.isTiledTileObstacle(layer, tiledTile),
        gid,
      };
    } else {
      // Update existing tile
      const hasImageAlready =
        tiles[x][y].imagePaths.find((i) => i === tiledTile.image) !== undefined;
      if (tiledTile.image && !hasImageAlready) {
        tiles[x][y].imagePaths.push(tiledTile.image);
      }
      // Set if obstacle
      tiles[x][y].obstacle =
        tiles[x][y].obstacle || this.isTiledTileObstacle(layer, tiledTile);
    }
    // Set resource
    // const resourceKind = this.getResourceKindOfTile(tiledTile);
    // if (resourceKind) {
    //   tiles[x][y].resource = await spawnResource(x, y, resourceKind);
    // }
  }

  mapOfTiledMap(tiledMap: TiledMap): Map {
    if (tiledMap.orientation !== "orthogonal") {
      throw new Error("Only orthogonal maps supported");
    }
    const tiles: Tile[][] = array2d(tiledMap.width, tiledMap.height);

    for (const layer of tiledMap.layers) {
      if (layer.type === "tilelayer") {
        console.debug("process tile layer", layer.name);
        if (typeof layer.data !== "string") {
          for (const [idx, gid] of layer.data.entries()) {
            const x = idx % tiledMap.width;
            const y = Math.floor(idx / tiledMap.width);
            const tiledTile = this.gidToTiledTile(gid, tiledMap);
            if (tiledTile !== undefined) {
              this.processTile(tiles, layer, tiledTile, x, y, gid);
            }
          }
        }
      } else if (layer.type === "objectgroup") {
        console.debug("process object layer", layer.name);
      }
    }
    return { tiles, tiledMap };
  }

  export() {
    execSync(
      `tiled --export-map json ${this.tmxFilePath} ${this.jsonFilePath}`
    );
  }

  loadMap(): Map {
    console.debug("load map");
    if (fs.existsSync(this.jsonFilePath) && !process.env.BYPASS_CACHE) {
      console.debug("map found in cache, load cache");
      return this.mapOfTiledMap(
        JSON.parse(fs.readFileSync(this.jsonFilePath, "utf8"))
      );
    } else {
      console.debug("map not found in cache");
      const jsonFiles = fs
        .readdirSync(this.tmxFileDir)
        .filter((file) => file.endsWith(".json"));
      jsonFiles.forEach((file) => fs.rmSync(`${this.tmxFileDir}/${file}`));
      this.export();
      return this.mapOfTiledMap(
        JSON.parse(fs.readFileSync(this.jsonFilePath, "utf8"))
      );
    }
  }

  getMap(): Map {
    if (this.map === undefined) {
      console.debug("initialize map once");
      this.map = this.loadMap.bind(this)();
    }
    return this.map;
  }

  sliceMap(posX: number, posY: number, width: number, height: number): Map {
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
    const map = this.getMap();
    for (const [x, col] of map.tiles.slice(fromX, toX).entries()) {
      for (const [y, tile] of col.slice(fromY, toY).entries()) {
        // copy over
        tiles[x][y] = { ...tile };
      }
    }
    return { ...map, tiles };
  }
}
