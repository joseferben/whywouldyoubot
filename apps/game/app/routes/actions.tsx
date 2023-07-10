import type { ActionFunction } from "@remix-run/node";
import type { Action } from "~/action";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const { x, y, tag } = (await request.json()) as Action;
  const player = await container.sessionService.requirePlayer(request);

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
