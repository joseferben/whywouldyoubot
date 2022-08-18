import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import {
    ActionFunction,
    json,
    LoaderFunction
} from "@remix-run/server-runtime";
import { getMiniMapByUser, MiniMapTile } from "~/minimap.server";
import { updateUser } from "~/models/user.server";
import { requireUser } from "~/session.server";
import imageAvatar from "../../../public/assets/avatars/1.png";
import imageHoney from "../../../public/assets/items/honey.png";
import imageCow from "../../../public/assets/npcs/cow.png";

type LoaderData = {
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const miniMap = await getMiniMapByUser(user);
  return json<LoaderData>({ miniMap });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const type = formData.get("type");
  const x = formData.get("x");
  const y = formData.get("y");
  const user = await requireUser(request);
  if (
    typeof x === "string" &&
    typeof y === "string" &&
    x !== null &&
    y !== null
  ) {
    user.walk(parseInt(x), parseInt(y));
  }
  await updateUser(user);
  const miniMap = await getMiniMapByUser(user);
  return json<LoaderData>({ miniMap });
};

function NpcList() {
  return (
    <ul className="text-sm">
      <li className="flex border-b border-px">
        <img
          style={{ imageRendering: "pixelated" }}
          height="38"
          width="38"
          src={imageCow}
        />
        <a className="pt-1 link link-secondary" href="">
          Cow
        </a>
        <div className="pt-1 ml-auto pr-2">
          <Link className="ml-2 btn btn-primary btn-xs" to="/game">
            Attack
          </Link>
        </div>
      </li>
    </ul>
  );
}
function ItemList() {
  return (
    <ul className="text-sm">
      <li className="flex border-b border-px">
        <img
          style={{ imageRendering: "pixelated" }}
          height="38"
          width="38"
          src={imageHoney}
        />
        <a className="pt-1 link link-secondary" href="">
          Honey
        </a>
        <div className="pt-1 ml-auto pr-2">
          <Link className="ml-2 btn btn-primary btn-xs" to="/game">
            Pick up
          </Link>
        </div>
      </li>
    </ul>
  );
}

function Field() {
  return (
    <div className="overflow-auto">
      <h1 className="text-lg font-bold">Clearview - Meadows</h1>
      <span className="text-sm">You feel the sun shining on your neck.</span>
      <NpcList />
      <NpcList />
      <NpcList />
      <NpcList />
      <NpcList />
      <NpcList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
      <ItemList />
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
      className={`relative w-10 h-10 ${tile.canWalk && "cursor-pointer"}`}
    >
      {tile.isCenter && (
        <img
          draggable={false}
          className="absolute z-30"
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
          }}
          height="50"
          width="50"
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
          draggable={false}
          className="absolute"
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
            zIndex: `${idx + 1}`,
          }}
          height="50"
          width="50"
          key={image}
          src={image}
        ></img>
      ))}
      <img
        draggable={false}
        style={{
          userSelect: "none",
          imageRendering: "pixelated",
          zIndex: "1",
        }}
        height="50"
        width="50"
        src={ground}
      ></img>
    </div>
  );
}

function Map({ miniMap }: LoaderData) {
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

export default function Main() {
  const { miniMap } = useLoaderData() as LoaderData;
  return <Field />;
}
