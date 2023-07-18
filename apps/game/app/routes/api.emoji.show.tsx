import type { ActionFunction } from "@remix-run/node";
import type { Emoji } from "@wwyb/core";
import { respond } from "@wwyb/core";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const action = (await request.json()) as { emoji: Emoji };
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  return respond(container.emojiService.showEmoji(player, action.emoji.id));
};
