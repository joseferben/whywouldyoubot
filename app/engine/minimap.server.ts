import path from "path/posix";
import imageAvatar from "../../public/assets/avatars/1.png";
import { getNpcsByRect, Npc } from "../models/npc.server";
import { getUsersByRect, User } from "../models/user.server";
import { Rectangle } from "../utils";
import { map, sliceMap, Tile } from "./map.server";

const WIDTH = 9;
const HEIGHT = 9;

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

type Positionable = { posX: number; posY: number };

class Map2d<T extends Positionable> {
  // This is a temporary datastructure to efficiently store thing on a 2D map
  map: { [key: string]: { [key: string]: T[] } };
  constructor(users: T[]) {
    const result: { [key: string]: { [key: string]: T[] } } = {};
    users.forEach((u) => {
      if (result[u.posX]) {
        if (result[u.posX][u.posY]) {
          result[u.posX][u.posY].push(u);
        } else {
          result[u.posX][u.posY] = [u];
        }
      } else {
        result[u.posX] = {};
        result[u.posX][u.posY] = [u];
      }
    });
    this.map = result;
  }

  get(x: number, y: number): T[] {
    return (this.map[x] ? this.map[x][y] : []) || [];
  }
}

async function getUsersByRectAsMap(rec: Rectangle) {
  const users = await getUsersByRect(rec);
  return new Map2d<User>(users);
}

async function getNpcsByRectAsMap(rec: Rectangle) {
  const users = await getNpcsByRect(rec);
  return new Map2d<Npc>(users);
}

function normalizeImagePath(p: string): string {
  const arr = p.split(path.sep);
  arr.shift();
  return ["assets", ...arr].join(path.sep);
}

function getImagePaths(userMap: Map2d<User>, npcMap: Map2d<Npc>, tile: Tile) {
  const imagePaths = tile.imagePaths.map(normalizeImagePath);
  const users = userMap.get(tile.x, tile.y);
  const npcs = npcMap.get(tile.x, tile.y);
  // TODO add custom avatars here
  users.forEach((_) => imagePaths.push(imageAvatar));
  npcs.forEach((npc) => imagePaths.push(npc.kind().image));
  return Array.from(new Set(imagePaths));
}

export async function getMiniMapByUser(user: User): Promise<MiniMap> {
  const mapSlice = sliceMap(map, user.posX, user.posY, WIDTH, HEIGHT);
  const rec = {
    x: user.posX - Math.round(WIDTH / 2),
    y: user.posY - Math.round(HEIGHT / 2),
    width: WIDTH,
    height: HEIGHT,
  };
  const users = await getUsersByRectAsMap(rec);
  const npcs = await getNpcsByRectAsMap(rec);
  const tiles: MiniMapTile[][] = mapSlice.tiles.map((col: Tile[]) =>
    col.map((tile: Tile) => {
      return {
        imagePaths: getImagePaths(users, npcs, tile),
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
