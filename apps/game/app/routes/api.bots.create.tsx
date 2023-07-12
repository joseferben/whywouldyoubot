import type { ActionFunction } from "@remix-run/node";
import { container } from "~/container.server";

function toResponse(data: any) {
  return data ? new Response(JSON.stringify(data)) : null;
}

export const action: ActionFunction = async ({ request }) => {
  const action = await request.json();
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);

  if (action.name !== null) {
    return toResponse(container.botService.create(action.name, player));
  }

  return null;
};
