import { Link } from "@remix-run/react";
import {
    ActionFunction,
    json,
    LoaderFunction
} from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
import { requireUser } from "~/session.server";
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
  return null;
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
        <a className="pt-1" href="">
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
        <a className="pt-1" href="">
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

export default function Index() {
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
