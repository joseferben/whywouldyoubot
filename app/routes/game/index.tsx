import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
import { getUserById } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import imageHoney from "../../../public/assets/items/honey.png";
import imageCow from "../../../public/assets/npcs/cow.png";

type LoaderData = {
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
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
        <a className="pt-1 btn-link btn-sm" href="">
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
        <a className="pt-1 btn-link btn-sm" href="">
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
    </div>
  );
}

function TileImageStack({ imagePaths }: { imagePaths: string[] }) {
  return (
    <div className="relative w-10 h-10">
      {imagePaths.map((image, idx) => (
        <img
          draggable={false}
          className="absolute"
          style={{ imageRendering: "pixelated" }}
          height="50"
          width="50"
          key={idx}
          src={image}
        ></img>
      ))}
    </div>
  );
}

function Map({ miniMap }: LoaderData) {
  return (
    <div className="flex">
      {miniMap.tiles.map((tileX, x) => (
        <div key={x}>
          {tileX.map((tileY) => (
            <TileImageStack imagePaths={tileY.imagePaths} />
          ))}
        </div>
      ))}
    </div>
  );
}
export default function Main() {
  const { miniMap } = useLoaderData() as LoaderData;

  return (
    <div style={{ minHeight: "60%" }} className="flex flex-col">
      <Field />
      <div className="mb-1">
        <Map miniMap={miniMap} />
      </div>
    </div>
  );
}
