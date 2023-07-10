import type { LoaderArgs } from "@remix-run/node";
import type { ServerEvent } from "@wwyb/core";
import { eventStream } from "remix-utils";
import { container } from "~/container.server";

export async function loader({ request }: LoaderArgs) {
  const player = await container.authService.ensurePlayer(request);
  return eventStream(request.signal, function setup(send) {
    const playerEmitter = container.clientEventService.playerEmitter(player);
    playerEmitter.emitter.on((event: ServerEvent) => {
      try {
        send({ event: "event", data: JSON.stringify(event) });
      } catch (e) {
        console.error(e);
        // falls through
      }
    });
    return function clear() {
      playerEmitter.emitter.emitter.removeAllListeners();
    };
  });
}
