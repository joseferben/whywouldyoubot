import path from "path/posix";
import { map, sliceMap, Tile } from "./map.server";
import { User } from "./models/user.server";

const WIDTH = 9;
const HEIGHT = 5;

export interface MiniMapTile {
  imagePaths: string[];
  canSee: boolean;
  canWalk: boolean;
  isCenter: boolean;
  x: number;
  y: number;
}

export interface MiniMap {
  tiles: MiniMapTile[][];
  posX: number;
  posY: number;
}

function normalizeImagePath(p: string): string {
  const arr = p.split(path.sep);
  arr.shift();
  return ["assets", ...arr].join(path.sep);
}
export async function getMiniMapByUser(user: User): Promise<MiniMap> {
  const mapSlice = sliceMap(map, user.posX, user.posY, WIDTH, HEIGHT);
  const tiles: MiniMapTile[][] = mapSlice.tiles.map((col: Tile[]) =>
    col.map((tile: Tile) => {
      return {
        imagePaths: Array.from(
          new Set(tile.imagePaths.map(normalizeImagePath))
        ),
        canSee: user.canSee(tile.x, tile.y),
        canWalk: user.canWalk(tile.x, tile.y),
        isCenter: user.posX === tile.x && user.posY === tile.y,
        x: tile.x,
        y: tile.y,
      };
    })
  );
  return Promise.resolve({
    tiles,
    posX: user.posX,
    posY: user.posY,
  });
}
