import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useFetcher, useLoaderData } from "@remix-run/react";
import Navigation from "~/components/navigation/Navigation";
import { container } from "~/container.server";
import MiniMap from "~/components/minimap/MiniMap";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await container.sessionService.requireUser(request);
  const player = container.playerService.findByUserId(user.id);
  if (!player) return redirect("/");
  //const goldAmount = container.inventoryService.gold(player);
  // const [messages, miniMap] = await Promise.all([
  //   container.items.messageService.findAll(),
  //   container.items.miniMapService.findByPlayer(player),
  // ]);
  return json({
    // goldAmount,
    // messages,
    // miniMap,
    player,
    hasPasswordSet: user.password !== null,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const x = formData.get("x");
  const y = formData.get("y");
  const player = await container.sessionService.requirePlayer(request);
  if (player == null) {
    return redirect("/");
  }

  if (
    typeof x === "string" &&
    typeof y === "string" &&
    x !== null &&
    y !== null &&
    container.walkService.canWalk(player, parseInt(x), parseInt(y))
  ) {
    container.walkService.walk(player, parseInt(x), parseInt(y));
  }
  return null;
};

function PasswordWarning() {
  return (
    <div className="alert alert-info rounded-none text-xs shadow-lg md:text-sm lg:text-base">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 flex-shrink-0 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          You have no password set. If you log out, you won't be able to log
          back in.{" "}
          <Link className="underline" to="/game/settings/password">
            Set a password
          </Link>{" "}
          to keep your progress.
        </span>
      </div>
    </div>
  );
}

export default function Game() {
  const { miniMap, player, hasPasswordSet } = useLoaderData<typeof loader>();

  //const id = useEventSource("/sse/updates");

  const fetcher = useFetcher();

  return (
    <div className="mx-auto h-full w-full md:flex">
      <div className="relative h-2/5 w-full overflow-hidden md:h-full md:w-1/2 lg:w-3/5 xl:w-2/3">
        {!hasPasswordSet && (
          <div className="absolute z-50 w-full">
            <PasswordWarning />
          </div>
        )}
        <MiniMap fetcher={fetcher} miniMap={miniMap} />
      </div>
      <div className="flex h-3/5 w-full flex-col px-1 md:h-full md:w-1/2 lg:w-2/5 xl:w-1/3">
        <Navigation fetcher={fetcher} player={player} />
        <Outlet />
      </div>
    </div>
  );
}
