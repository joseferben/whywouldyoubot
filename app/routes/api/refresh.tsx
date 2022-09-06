import { LoaderFunction } from "@remix-run/server-runtime";
import { refresher } from "~/engine/refresher.server";
import { requireUser } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const body = new ReadableStream({
    async start(c) {
      console.log("subscribe()");
      const subscription = refresher.observable.subscribe(
        (refresher) => {
          console.log(`push refresh for user ${refresher.userId} to client`);
          if (refresher.userId === user.entityId) {
            c.enqueue("event: refresh\n");
            c.enqueue(`data: \n\n`);
          }
        },
        (error) => {
          c.error(error);
        }
      );
      request.signal.onabort = () => {
        subscription.unsubscribe();
        c.close();
      };
    },
  });

  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-transform");
  headers.set("Content-Type", "text/event-stream");
  return new Response(body, { headers, status: 200 });
};
