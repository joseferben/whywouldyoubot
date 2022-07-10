import path from "path/posix";
import { map, sliceMap, Tile } from "./map.server";
import { User } from "./models/user.server";

const WIDTH = 9;
const HEIGHT = 5;

interface MiniMapTile {
  imagePaths: string[];
  walkable: boolean;
}

interface MiniMap {
  tiles: MiniMapTile[][];
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
        imagePaths: tile.imagePaths.map(normalizeImagePath),
        walkable: user.canWalk(tile.x, tile.y),
      };
    })
  );
  return Promise.resolve({
    tiles,
  });
}
