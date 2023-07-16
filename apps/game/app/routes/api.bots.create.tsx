import type { ActionFunction } from "@remix-run/node";
import { respond } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const action = (await request.json()) as { name: string };
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  return respond(container.botService.create(action.name, player));
};
