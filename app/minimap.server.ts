import fs from "fs";
import { User } from "./models/user.server";

const WIDTH = 9;
const HEIGHT = 5;

interface MiniMapTile {
  images: string[];
  walkable: boolean;
}

interface MiniMap {
  tiles: MiniMapTile[][];
}

function randomTiles(images: string[], n: number) {
  return Array.from(Array(n)).map(() => {
    const image = images[Math.floor(Math.random() * images.length)];
    return {
      images: [`/assets/tiles/ground/${image}`],
      walkable: true,
    };
  });
}

export async function getMiniMapByUser(user: User): Promise<MiniMap> {
  const images = await fs.promises.readdir("public/assets/tiles/ground");
  const tiles = Array.from(Array(WIDTH)).map(() => {
    return randomTiles(images, HEIGHT);
  });
  return Promise.resolve({ tiles });
}
