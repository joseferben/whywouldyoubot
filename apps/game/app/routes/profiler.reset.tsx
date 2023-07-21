import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { config } from "~/config";
import { container } from "~/container.server";
import { Profiler } from "~/engine/Profiler";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  if (player.username !== config.adminUsername) redirect("/");
  container.onlineService.ensureOnline(player);
  Profiler.resetStats();
  return redirect("/profiler/stats");
};
