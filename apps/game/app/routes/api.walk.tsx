import type { ActionFunction } from "@remix-run/node";
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
    return "Can't walk there";

  container.walkService.startWalk(player, x, y);

  return null;
};
