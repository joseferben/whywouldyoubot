import { type ActionFunction } from "@remix-run/node";
import { respond } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const { x, y } = (await request.json()) as { x: number; y: number };
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);

  if (x === null || y === null || x === undefined || y === undefined)
    return respond("Invalid position provided");

  return respond(container.potentialActionService.findByPosition(player, x, y));
};
