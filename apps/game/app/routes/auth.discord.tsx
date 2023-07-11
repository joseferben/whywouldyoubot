import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  return container.authService.auth.authenticate("discord", request, {
    successRedirect: "/game",
    failureRedirect: "/",
  });
};

export let loader: LoaderFunction = () => redirect("/");
