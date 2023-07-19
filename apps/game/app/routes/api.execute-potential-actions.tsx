import { type ActionFunction } from "@remix-run/node";
import type { PotentialAction } from "@wwyb/core";
import { respond } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const p = (await request.json()) as PotentialAction;
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);

  return respond(container.potentialActionService.execute(player, p.action));
};
