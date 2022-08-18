import { Link } from "@remix-run/react";
import {
    ActionFunction,
    json,
    LoaderFunction
} from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
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
  return null;
};

function NpcListItemFighting() {
  return (
    <li className="flex border-b border-px justify-between">
      <div className="flex">
        <img
          style={{ imageRendering: "pixelated" }}
          height="38"
          width="38"
          src={imageCow}
        />
        <a className="pt-2" href="">
          Cow
        </a>
      </div>
      <progress className="mx-3 mt-4 progress progress-primary w-56"></progress>
      <div className="flex pr-2">
        <img
          width="38"
          height="38"
          draggable={false}
          style={{
            userSelect: "none",
            imageRendering: "pixelated",
          }}
          src={imageAvatar}
        />
      </div>
    </li>
  );
}

function NpcListItem() {
  return (
    <li className="flex border-b border-px">
      <img
        style={{ imageRendering: "pixelated" }}
        height="38"
        width="38"
        src={imageCow}
      />
      <a className="pt-2" href="">
        Cow
      </a>
      <div className="pt-1 ml-auto pr-2">
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Attack
        </Link>
      </div>
    </li>
  );
}

function NpcList() {
  return (
    <ul className="text-sm">
      <NpcListItemFighting />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
      <NpcListItem />
    </ul>
  );
}

function ItemListItem() {
  return (
    <li className="flex border-b border-px">
      <img
        style={{ imageRendering: "pixelated" }}
        height="38"
        width="38"
        src={imageHoney}
      />
      <a className="pt-2" href="">
        Honey
      </a>
      <div className="pt-1 ml-auto pr-2">
        <Link className="ml-2 btn btn-primary btn-xs" to="/game">
          Pick up
        </Link>
      </div>
    </li>
  );
}
function ItemList() {
  return (
    <ul className="text-sm">
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
      <ItemListItem />
    </ul>
  );
}

export default function Index() {
  return (
    <div className="overflow-auto">
      <h1 className="text-lg font-bold">Clearview - Meadows</h1>
      <span className="text-sm">You feel the sun shining on your neck.</span>
      <NpcList />
      <ItemList />
    </div>
  );
}
