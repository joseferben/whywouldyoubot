import path from "path/posix";
import imageAvatar from "../public/assets/avatars/1.png";
import { map, sliceMap, Tile } from "./map.server";
import { getUsersByRectAsMap, User, UserMap } from "./models/user.server";

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

function getImagePaths(userMap: UserMap, tile: Tile) {
  const imagePaths = tile.imagePaths.map(normalizeImagePath);
  const users = userMap.get(tile.x, tile.y);
  // TODO add custom avatars here
  users.forEach((u) => imagePaths.push(imageAvatar));
  return Array.from(new Set(imagePaths));
}

export async function getMiniMapByUser(user: User): Promise<MiniMap> {
  const mapSlice = sliceMap(map, user.posX, user.posY, WIDTH, HEIGHT);
  const userMap = await getUsersByRectAsMap(
    user.posX,
    user.posY,
    WIDTH,
    HEIGHT
  );
  const tiles: MiniMapTile[][] = mapSlice.tiles.map((col: Tile[]) =>
    col.map((tile: Tile) => {
      return {
        imagePaths: getImagePaths(userMap, tile),
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
