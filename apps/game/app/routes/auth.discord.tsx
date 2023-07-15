import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  return container.authService.discord.authenticate("discord", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};

export async function loader({ request }: LoaderArgs) {
  return await container.authService.discord.isAuthenticated(request, {
    successRedirect: "/",
  });
}
