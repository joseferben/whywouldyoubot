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
import MiniMap from "~/components/minimap/MiniMap";
import Navigation from "~/components/navigation/Navigation";
import { message } from "~/engine/chat.server";

import { getMiniMapByUser } from "~/engine/minimap.server";
import {
    ChatMessage,
    getChatMessagesByUser
} from "~/engine/models/message.server";
import { updateUser } from "~/engine/models/user.server";
import { useRefresh } from "~/hooks";
import { requireUser } from "~/session.server";

type LoaderData = {
  chatMessages: Awaited<ReturnType<typeof getChatMessagesByUser>>;
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
};

interface ActionData {
  errors?: {
    message?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const type = formData.get("type");
  const x = formData.get("x");
  const y = formData.get("y");
  const m = formData.get("message");
  const user = await requireUser(request);
  if (user == null) {
    return redirect("/");
  }

  if (type === "chat") {
    if (typeof m !== "string" || m.length > 200) {
      return json<ActionData>(
        { errors: { message: "Chat message too long" } },
        { status: 400 }
      );
    }
    // TODO return updated chat
    await message({ message: m, user });
  } else if (type === "walk") {
    if (
      typeof x === "string" &&
      typeof y === "string" &&
      x !== null &&
      y !== null &&
      user.canWalk(parseInt(x), parseInt(y))
    ) {
      // TODO return updated tilemap
      user.walk(parseInt(x), parseInt(y));
      await updateUser(user);
    }
  } else {
    return json<ActionData>(
      { errors: { message: "Invalid command received" } },
      { status: 400 }
    );
  }

  return redirect("/game");
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const [chatMessages, miniMap] = await Promise.all([
    getChatMessagesByUser(user.entityId),
    getMiniMapByUser(user),
  ]);
  return json<LoaderData>({ chatMessages, miniMap });
};

function ChatMessages() {
  const loaderData = useLoaderData() as LoaderData;
  const fetcher = useFetcher();
  const data: LoaderData = fetcher.data || loaderData;
  const ref = React.useRef<HTMLDivElement>(null);
  // TODO make sure that we truly need to register that twice

  useRefresh(fetcher);
  useRefresh(fetcher, "/game/index");

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [data.chatMessages.length]);

  return (
    <div
      ref={ref}
      style={{ minHeight: "15rem" }}
      className="mb-1 overflow-auto text-xs"
    >
      <ul className="flex flex-col break-words">
        {data.chatMessages.map((d: ChatMessage) => (
          <li className="pl-1" key={d.entityId}>
            <a href="" className="text-white">
              {d.username}:
            </a>
            :<span className="ml-1 text-white">{d.message}</span>
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
    <Form className="flex p-1" method="post">
      <div className="form-control w-full">
        <div className="input-group">
          <select
            defaultValue={"Say"}
            className="select select-bordered select-sm"
          >
            <option>Say</option>
            <option>Yell</option>
          </select>
          <input
            type="text"
            name="message"
            ref={inputRef}
            className="input input-bordered input-sm w-full"
          ></input>
          <input type="hidden" name="type" value="chat"></input>
          <button type="submit" className="btn btn-primary btn-sm">
            Chat
          </button>
        </div>
      </div>
    </Form>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ maxWidth: "450px" }}
      className="flex w-full mx-auto h-screen min-h-screen flex-col"
    >
      {children}
    </div>
  );
}

export default function Game() {
  const { miniMap } = useLoaderData<LoaderData>();
  const loaderData = useLoaderData() as LoaderData;
  const fetcher = useFetcher();
  const data: LoaderData = fetcher.data || loaderData;
  const ref = React.useRef<HTMLDivElement>(null);

  useRefresh(fetcher);
  useRefresh(fetcher, "/game/index");

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [data.chatMessages.length]);

  return (
    <Screen>
      <div className="h-full p-1 overflow-auto">
        <Outlet />
      </div>
      <div>
        <Navigation />
        <div className="relative overflow-hidden">
          <MiniMap miniMap={miniMap} />
          <div className="absolute top-0 w-full z-40 pointer-events-none">
            <ChatMessages />
          </div>
        </div>
        <ChatInput />
      </div>
    </Screen>
  );
}
