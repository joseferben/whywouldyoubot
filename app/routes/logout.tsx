import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  const player = await container.sessionService.requirePlayer(request);
  if (!player) return redirect("/");
  console.debug(`player ${player.username} logs out`);
  //container.onlineService.logout(player);
  return container.sessionService.logout(request);
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
