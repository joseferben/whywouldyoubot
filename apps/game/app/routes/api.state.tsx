import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { SerializedClientState } from "@wwyb/core";
import { container } from "~/container.server";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  const players = container.playerService.findAroundPlayer(player);
  const ground = container.mapService.findTilesByPlayer(player);
  return json({
    me: player.id,
    droppedItems: [],
    inventory: [],
    npcs: [],
    actions: [],
    ground,
    players,
  } satisfies SerializedClientState);
};
