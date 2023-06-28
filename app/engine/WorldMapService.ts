import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import type { TiledLayer, TiledTile } from "tiled-types";
import type TiledMap from "tiled-types";
import { getResourceKind } from "~/content";
import type { Player, ResourceKind } from "~/engine/core";
import { EntityDB } from "./EntityDB/EntityDB";
import { initOnce } from "~/utils";

export function stripPathToAssets(inputPath: string): string {
  const parts = inputPath.split("/");
  const assetsIndex = parts.indexOf("assets");

  if (assetsIndex === -1) {
    throw new Error(`Path does not contain "assets" directory: ${inputPath}`);
  }

  const newPathParts = parts.slice(assetsIndex);
  return newPathParts.join("/");
}

export type WorldMapTile = {
  description: string;
  imagePaths: string[];
  x: number;
  y: number;
  obstacle: boolean;
  gid: number;
  id: string;
};

export class WorldMapService {
  db!: EntityDB<WorldMapTile>;
  jsonFilePath: string;
  tmxFilePath: string;

  constructor(
    readonly obstacleLayerName: string,
    readonly playerVisibility: number,
    readonly mapPath: string
  ) {
    const [db, foundInCache] = initOnce(
      this.constructor.name,
      () => new EntityDB<WorldMapTile>({ spatial: true })
    );
    this.db = db;
    this.mapPath = mapPath;
    this.tmxFilePath = `${this.mapPath}/map.tmx`;
    const tmxFile = fs.readFileSync(this.tmxFilePath);
    const hashSum = crypto.createHash("md5");
    hashSum.update(tmxFile);
    const hash = hashSum.digest("base64url");
    this.jsonFilePath = `${this.mapPath}/map.${hash}.json`;
    if (!foundInCache) {
      this.loadMap();
    }
  }

  private gidToTiledTile(gid: number, tiled: TiledMap): TiledTile | undefined {
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
    return Array.from(this.db.findByPosition(x, y))[0]?.obstacle;
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

  /**
   * Load tile map and store in database.
   */
  loadTile(
    layer: TiledLayer,
    tiledTile: TiledTile,
    x: number,
    y: number,
    gid: number
  ) {
    const description = this.getDescription(tiledTile);
    const tile = this.db.findOneByPosition(x, y);
    if (!tile) {
      // Create tiled
      this.db.create({
        gid: gid,
        description,
        imagePaths: tiledTile.image ? [stripPathToAssets(tiledTile.image)] : [],
        x,
        y,
        obstacle: this.isTiledTileObstacle(layer, tiledTile),
      });
    } else {
      // Set if obstacle
      tile.obstacle =
        tile.obstacle || this.isTiledTileObstacle(layer, tiledTile);

      // Update existing tile
      if (tiledTile.image !== undefined) {
        const hasImageAlready =
          tile.imagePaths.find(
            (i) => i === stripPathToAssets(tiledTile.image as string)
          ) !== undefined;
        if (!hasImageAlready) {
          tile.imagePaths.push(stripPathToAssets(tiledTile.image));
        }
      }

      this.db.update(tile);
    }
  }

  loadTiledMap(tiledMap: TiledMap) {
    if (tiledMap.orientation !== "orthogonal") {
      throw new Error("Only orthogonal maps supported");
    }

    for (const layer of tiledMap.layers) {
      if (layer.type === "tilelayer") {
        console.debug("process tile layer", layer.name);
        if (typeof layer.data !== "string") {
          for (const [idx, gid] of layer.data.entries()) {
            const x = idx % tiledMap.width;
            const y = Math.floor(idx / tiledMap.width);
            const tiledTile = this.gidToTiledTile(gid, tiledMap);
            if (tiledTile !== undefined) {
              this.loadTile(layer, tiledTile, x, y, gid);
            }
          }
        }
      } else if (layer.type === "objectgroup") {
        console.debug("process object layer", layer.name);
      }
    }
  }

  export() {
    execSync(
      `tiled --export-map json ${this.tmxFilePath} ${this.jsonFilePath}`
    );
  }

  loadMap() {
    console.debug("load map");
    if (fs.existsSync(this.jsonFilePath) && !process.env.BYPASS_CACHE) {
      console.debug("map found in cache, load cache");
      return this.loadTiledMap(
        JSON.parse(fs.readFileSync(this.jsonFilePath, "utf8"))
      );
    } else {
      console.debug("map not found in cache");
      const jsonFiles = fs
        .readdirSync(this.mapPath)
        .filter((file) => file.endsWith(".json"));
      jsonFiles.forEach((file) => fs.rmSync(`${this.mapPath}/${file}`));
      this.export();
      return this.loadTiledMap(
        JSON.parse(fs.readFileSync(this.jsonFilePath, "utf8"))
      );
    }
  }

  findTilesByPlayer(player: Player) {
    return this.db.findByRectangle(
      // TODO extract players view distance
      player.x - this.playerVisibility,
      player.y - this.playerVisibility,
      this.playerVisibility * 2,
      this.playerVisibility * 2
    );
  }

  findTilesByPosition(x: number, y: number) {
    return this.db.findByPosition(x, y);
  }
}
