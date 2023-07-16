import { type ActionFunction } from "@remix-run/node";
import { respond } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const { x, y } = (await request.json()) as { x: number; y: number };
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);

  if (
    x === null ||
    y === null ||
    x === undefined ||
    y === undefined ||
    !container.walkService.canWalk(player, x, y)
  )
    return respond("Can't walk there");

  return respond(container.walkService.startWalk(player, x, y));
};
