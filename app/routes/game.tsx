import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Outlet,
  useFetcher,
  useLoaderData,
  useTransition
} from "@remix-run/react";
import React, { useEffect } from "react";
import { chat } from "~/chat.server";
import { ChatMessage, getChatMessagesByUser } from "~/models/message.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  chatMessages: Awaited<ReturnType<typeof getChatMessagesByUser>>;
};

interface ActionData {
  errors?: {
    message?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const message = formData.get("message");

  if (typeof message !== "string" || message.length > 200) {
    return json<ActionData>(
      { errors: { message: "Chat message too long" } },
      { status: 400 }
    );
  }

  await chat({ message, userId });
  return redirect("/game");
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const chatMessages = await getChatMessagesByUser(userId);

  console.log(chatMessages.length);
  return json<LoaderData>({ chatMessages });
};

export default function Game() {
  const initialData = useLoaderData() as LoaderData;
  const user = useUser();
  const fetcher = useFetcher();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const transition = useTransition();
  const fetcherData = fetcher.data as LoaderData;
  const data = fetcherData || initialData;

  useEffect(() => {
    const source = new EventSource("/api/chat", { withCredentials: true });
    source.addEventListener("chat", (_: any) => {
      fetcher.load("/game");
    });
    source.onerror = (e) => {
      console.error(e);
      source.close();
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && transition.state === "submitting") {
      inputRef.current.value = "";
    }
  }, [transition.state]);

  return (
    <div className="flex h-full min-h-screen flex-col">
      <fetcher.Form action="/logout" method="post">
        <button
          type="submit"
          className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
        >
          Logout
        </button>
      </fetcher.Form>

      <main className="flex h-full bg-white">
        <div className="flex-1 p-6">
          <Outlet />
          <div className="mx-auto">
            <Form method="post">
              <input
                type="text"
                name="message"
                ref={inputRef}
                className="rounded border border-gray-500 px-2 py-1 text-lg"
              ></input>
              <button
                type="submit"
                className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
              >
                Say
              </button>
            </Form>
            <ul>
              {data.chatMessages.map((d: ChatMessage) => (
                <li key={d.entityId}>
                  <span className="font-bold">{d.userId}:</span>
                  {d.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
