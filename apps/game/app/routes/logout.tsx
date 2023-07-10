import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const player = await container.authService.ensurePlayer(request);
  console.debug(`player ${player.username} logs out`);
  return container.sessionService.logout(request);
};

export const loader: LoaderFunction = async ({ request }) => {
  const player = await container.authService.ensurePlayer(request);
  console.debug(`player ${player.username} logs out`);
  return container.sessionService.logout(request);
};
