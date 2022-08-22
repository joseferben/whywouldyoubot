import { LoaderFunction } from "@remix-run/server-runtime";
import { observable } from "~/engine/chat.server";

export const loader: LoaderFunction = async ({ request }) => {
  const body = new ReadableStream({
    async start(c) {
      console.log("subscribe()");
      const subscription = observable.subscribe(
        (_) => {
          c.enqueue("event: chat\n");
          c.enqueue(`data: \n\n`);
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
