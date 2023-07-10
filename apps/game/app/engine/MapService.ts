import type { WorldMapTile } from "./WorldMapService";

type Action = {
  name: string;
  targetId: string;
  description: string;
  needsConfirmation: boolean;
};

export type PlayerMapTile = {
  tile: WorldMapTile;
  actions: Action[];
};
