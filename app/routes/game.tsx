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
import { message } from "~/chat.server";
import { useRefresher } from "~/hooks";
import { ChatMessage, getChatMessagesByUser } from "~/models/message.server";
import { getUserById } from "~/models/user.server";
import { requireUserId } from "~/session.server";

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
  const user = await getUserById(userId);
  const formData = await request.formData();
  const m = formData.get("message");

  if (typeof m !== "string" || m.length > 200) {
    return json<ActionData>(
      { errors: { message: "Chat message too long" } },
      { status: 400 }
    );
  }

  await message({ message: m, user });
  return redirect("/game");
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const chatMessages = await getChatMessagesByUser(userId);
  return json<LoaderData>({ chatMessages });
};

function ChatMessages() {
  const loaderData = useLoaderData() as LoaderData;
  const fetcher = useFetcher();
  const data: LoaderData = fetcher.data || loaderData;
  const ref = React.useRef<HTMLDivElement>(null);

  useRefresher("/api/chat", "/game", "chat", fetcher);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [data.chatMessages.length]);

  return (
    <div ref={ref} className="h-full mb-1 overflow-y-scroll">
      <ul className="flex flex-col-reverse break-words">
        {data.chatMessages.map((d: ChatMessage) => (
          <li className="border border-t-0 border-gray" key={d.entityId}>
            <span className="font-bold">{d.username}:</span>
            {d.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatInput() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const transition = useTransition();

  useEffect(() => {
    if (inputRef.current && transition.state === "submitting") {
      inputRef.current.value = "";
    }
  }, [transition.state]);

  return (
    <Form className="flex" method="post">
      <div className="form-control w-full">
        <div className="input-group">
          <select
            defaultValue={"Say"}
            className="select select-bordered select-sm"
          >
            <option>Say</option>
            <option>Shout</option>
          </select>
          <input
            type="text"
            name="message"
            ref={inputRef}
            className="input input-bordered input-sm w-full"
          ></input>
          <button type="submit" className="btn btn-primary btn-sm">
            Say
          </button>
        </div>
      </div>
    </Form>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ width: "450px" }}
      className="flex p-1 md:py-6 w-full mx-auto bg-white h-screen min-h-screen flex-col"
    >
      {children}
    </div>
  );
}

function Navigation() {
  return (
    <div className="mb-1 flex space-between">
      <button className="btn btn-xs">Map</button>
      <button className="ml-1 btn btn-xs">Inventory</button>
      <button className="ml-1 btn btn-xs">Character</button>
      <button className="ml-1 btn btn-xs">Settings</button>
      <Form action="/logout" method="post">
        <button type="submit" className="ml-1 btn btn-error btn-xs">
          Logout
        </button>
      </Form>
    </div>
  );
}
export default function Game() {
  return (
    <Screen>
      <Outlet />
      <Navigation />
      <ChatMessages />
      <ChatInput />
    </Screen>
  );
}
