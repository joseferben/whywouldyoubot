import type { ActionFunction } from "@remix-run/node";
import type { Action } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const { x, y, tag } = (await request.json()) as Action;
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);

  if (
    tag === "walk" &&
    x !== null &&
    y !== null &&
    container.walkService.canWalk(player, x, y)
  ) {
    container.walkService.startWalk(player, x, y);
  }

  return null;
};
