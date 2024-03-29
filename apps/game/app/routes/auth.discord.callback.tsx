import type { LoaderArgs } from "@remix-run/node";
import { container } from "~/container.server";

export const loader = async ({ request }: LoaderArgs) => {
  return container.authService.discord.authenticate("discord", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
