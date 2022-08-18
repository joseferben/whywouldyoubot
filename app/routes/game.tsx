import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
    Form,
    Link,
    Outlet,
    useFetcher,
    useLoaderData,
    useTransition
} from "@remix-run/react";
import React, { useEffect } from "react";
import { message } from "~/chat.server";
import { useRefresher } from "~/hooks";
import { getMiniMapByUser, MiniMapTile } from "~/minimap.server";
import { ChatMessage, getChatMessagesByUser } from "~/models/message.server";
import { getUserById } from "~/models/user.server";
import { requireUser, requireUserId } from "~/session.server";
import imageAvatar from "../../public/assets/avatars/1.png";
import imageGold from "../../public/assets/items/gold.png";

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

  if (user == null) {
    return redirect("/");
  }

  await message({ message: m, user });
  return redirect("/game");
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const chatMessages = await getChatMessagesByUser(user.entityId);
  const miniMap = await getMiniMapByUser(user);
  return json<LoaderData>({ chatMessages, miniMap });
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
    <div
      ref={ref}
      style={{ minHeight: "15rem" }}
      className="mb-1 overflow-auto text-sm"
    >
      <ul className="flex flex-col-reverse break-words">
        {data.chatMessages.map((d: ChatMessage) => (
          <li className="pl-1" key={d.entityId}>
            <a href="" className="font-bold btn-link">
              {d.username}
            </a>
            :<span className="ml-1">{d.message}</span>
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
      style={{ width: "450px" }}
      className="flex w-full mx-auto h-screen min-h-screen flex-col"
    >
      {children}
    </div>
  );
}

function Navigation() {
  return (
    <div className="px-1 mb-1 flex">
      <Link to="/game" className="btn btn-xs">
        Map
      </Link>
      <Link to="/game/inventory" className="ml-1 btn btn-xs">
        Inventory
      </Link>
      <Link to="/game/character" className="ml-1 btn btn-xs">
        Character
      </Link>
      <Link to="/game/settings" className="ml-1 btn btn-xs mr-2">
        Settings
      </Link>
      <div className="flex">
        <img style={{ imageRendering: "pixelated" }} src={imageGold}></img>
        <span className="font-bold">450</span>
      </div>
    </div>
  );
}

function Tile({ tile }: { tile: MiniMapTile }) {
  const fetcher = useFetcher();

  function handleClick() {
    if (tile.canWalk) {
      fetcher.submit(
        { type: "walk", x: String(tile.x), y: String(tile.y) },
        { method: "post" }
      );
    }
  }

  const [ground, ...layers] = tile.imagePaths;

  return (
    <div
      onClick={handleClick}
      className={`relative ${tile.canWalk && "cursor-pointer"}`}
    >
      {tile.isCenter && (
        <img
          width="100"
          height="100"
          draggable={false}
          className="absolute z-30"
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
          }}
          src={imageAvatar}
        ></img>
      )}
      <div
        className={`${
          !tile.canSee && !tile.isCenter && "opacity-20 bg-stone-900"
        } z-20 absolute w-full h-full`}
      ></div>
      {layers.map((image, idx) => (
        <img
          width="100"
          height="100"
          draggable={false}
          className="absolute"
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
            zIndex: `${idx + 1}`,
          }}
          key={image}
          src={image}
        ></img>
      ))}
      <img
        width="100"
        height="100"
        draggable={false}
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: "1",
        }}
        src={ground}
      ></img>
    </div>
  );
}

function Map() {
  const { miniMap } = useLoaderData() as LoaderData;
  return (
    <div className="flex">
      {miniMap.tiles.map((cols) => (
        <div key={cols[0].x}>
          {cols.map((tile: MiniMapTile) => (
            <Tile key={`${tile.x}/${tile.y}`} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MiniMapWithChatMessages() {
  return (
    <div className="relative">
      <div>
        <Map />
      </div>
      <div className="absolute top-0 w-full">
        <ChatMessages />
      </div>
    </div>
  );
}

export default function Game() {
  return (
    <Screen>
      <div className="h-auto p-1 mb-1 overflow-auto">
        <Outlet />
      </div>
      <div className="h-1/2">
        <Navigation />
        <MiniMapWithChatMessages />
        <ChatInput />
      </div>
    </Screen>
  );
}
