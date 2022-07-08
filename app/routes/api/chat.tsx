import { LoaderFunction } from "@remix-run/server-runtime";
import { Observable } from "observable-fns";
import { onChatMessage } from "~/chat.server";
import { ChatMessage } from "~/models/message.server";

const observable = new Observable((observer) => {
  console.log("registering onChatMessage");
  onChatMessage((m: ChatMessage) => observer.next(m));
});

export const loader: LoaderFunction = async ({ request }) => {
  const body = new ReadableStream({
    async start(c) {
      const subscription = observable.subscribe(
        (item) => {
          console.log("sending down event");
          c.enqueue("event: chat\n");
          c.enqueue(`data: ${JSON.stringify(item)}\n\n`);
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
