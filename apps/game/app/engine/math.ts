import type { TiledObject } from "tiled-types/types";

const TILE_DIMENSION = 16;

export function array2d(width: number, height: number) {
  return Array.from(Array(width), () => new Array(height));
}

export const range = (start: number, stop: number, step: number): number[] =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function pickRandom<T>(a: Array<T>): T {
  return a[Math.floor(Math.random() * a.length)];
}

export function pickRandomRect(
  rec: Rectangle,
  n: number
): { x: number; y: number }[] {
  const result = [];
  for (let i = 0; i <= n; i++) {
    const x = Math.round(Math.random() * rec.width + rec.x);
    const y = Math.round(Math.random() * rec.height + rec.y);
    result.push({ x, y });
  }
  return result;
}

export function pickRandomRange(r: [number, number]): number {
  return Math.floor(Math.random() * Math.abs(r[1] - r[0]) + r[0]);
}

export function tiledObjectToRectangle(o: TiledObject): Rectangle {
  return {
    x: Math.round(o.x / TILE_DIMENSION),
    y: Math.round(o.y / TILE_DIMENSION),
    width: Math.round(o.width / TILE_DIMENSION),
    height: Math.round(o.height / TILE_DIMENSION),
  };
}
