import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
    Form,
    NavLink,
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
import { updateUser } from "~/models/user.server";
import { requireUser } from "~/session.server";
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
    await message({ message: m, user });
  } else if (type === "walk") {
    if (
      typeof x === "string" &&
      typeof y === "string" &&
      x !== null &&
      y !== null
    ) {
      user.walk(parseInt(x), parseInt(y));
    }
    await updateUser(user);
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
      style={{ maxWidth: "700px" }}
      className="flex w-full mx-auto h-screen min-h-screen flex-col"
    >
      {children}
    </div>
  );
}

function Navigation() {
  return (
    <div className="p-1 mb-1 flex justify-between">
      <div className="flex">
        <NavLink
          to="/game"
          className={({ isActive }) =>
            `btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Map
        </NavLink>
        <NavLink
          to="/game/inventory"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Inventory
        </NavLink>
        <NavLink
          to="/game/character"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Character
        </NavLink>
        <NavLink
          to="/game/settings"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Settings
        </NavLink>
      </div>
      <div className="ml-1 flex">
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
      {layers.map((image, idx) => {
        return (
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
            src={`/${image}`}
          ></img>
        );
      })}
      <img
        width="100"
        height="100"
        draggable={false}
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: "1",
        }}
        src={`/${ground}`}
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
    <div className="relative overflow-hidden">
      <Map />
      <div className="absolute top-0 w-full z-40 pointer-events-none">
        <ChatMessages />
      </div>
    </div>
  );
}

function Main() {
  return (
    <div className="h-full p-1 overflow-auto">
      <Outlet />
    </div>
  );
}

function LowerHalf({ children }: { children: React.ReactNode }) {
  return <div className="h-1/2">{children}</div>;
}

export default function Game() {
  return (
    <Screen>
      <Main />
      <LowerHalf>
        <Navigation />
        <MiniMapWithChatMessages />
        <ChatInput />
      </LowerHalf>
    </Screen>
  );
}
