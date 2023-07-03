import type { ActionFunction } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const { x, y } = (await request.json()) as {
    type: "walk";
    x: number;
    y: number;
  };
  const player = await container.sessionService.requirePlayer(request);

  if (x !== null && y !== null && container.walkService.canWalk(player, x, y)) {
    container.walkService.startWalk(player, x, y);
  }
  return null;
};
