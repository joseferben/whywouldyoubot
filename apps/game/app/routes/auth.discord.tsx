import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { container } from "~/container.server";

export const action: ActionFunction = async ({ request }) => {
  return container.authService.authenticate(request);
};

export let loader: LoaderFunction = () => redirect("/");
