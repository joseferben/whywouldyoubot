import type { ActionFunction } from "@remix-run/node";
import { container } from "~/container.server";
import { toResponse } from "~/utils";

export const action: ActionFunction = async ({ request }) => {
  const action = (await request.json()) as { id: string };
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  return toResponse(container.botService.db.deleteById(action.id));
};
