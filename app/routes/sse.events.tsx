import type { LoaderArgs } from "@remix-run/node";
import { eventStream } from "remix-utils";
import { container } from "~/container.server";
import type { ClientEvent } from "~/engine/ClientEventService";

export async function loader({ request }: LoaderArgs) {
  const player = await container.sessionService.requirePlayer(request);
  return eventStream(request.signal, function setup(send) {
    const playerEmitter = container.clientEventService.playerEmitter(player);
    playerEmitter.emitter.on((event: ClientEvent) => {
      try {
        send({ event: "event", data: JSON.stringify(event) });
      } catch (e) {
        // falls through
      }
    });
    return function clear() {};
  });
}
