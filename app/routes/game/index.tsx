import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
import { requireUserId } from "~/session.server";
import imageHoney from "../../../public/assets/items/honey.png";
import imageCow from "../../../public/assets/npcs/cow.png";

type LoaderData = {
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const miniMap = await getMiniMapByUser(userId);
  return json<LoaderData>({ miniMap });
};

function NpcList() {
  return (
    <ul>
      <li className="flex">
        <img
          style={{ imageRendering: "pixelated" }}
          height="40"
          width="40"
          src={imageCow}
        />
        <a className="ml-2 btn-link" href="">
          Cow (2)
        </a>
        <span className="ml-2">|</span>
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Attack
        </Link>
      </li>
    </ul>
  );
}
function ItemList() {
  return (
    <ul>
      <li className="flex">
        <img
          style={{ imageRendering: "pixelated" }}
          height="40"
          width="40"
          src={imageHoney}
        />
        <a className="ml-2 btn-link" href="">
          Honey
        </a>
        <span className="ml-2">|</span>
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Pick up
        </Link>
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

function Map({ miniMap }: LoaderData) {
  return (
    <div className="flex">
      {miniMap.tiles.map((tileX, idx) => (
        <div key={idx}>
          {tileX.map((tileY) =>
            tileY.images.map((image, idx) => (
              <img
                draggable={false}
                className="select-none"
                style={{ imageRendering: "pixelated" }}
                height="50"
                width="50"
                key={idx}
                src={image}
              ></img>
            ))
          )}
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
