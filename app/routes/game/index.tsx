import { Link } from "@remix-run/react";
import {
    ActionFunction,
    json,
    LoaderFunction
} from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
import { requireUser } from "~/session.server";
import imageAvatar1 from "../../../public/assets/avatars/1.png";
import imageAvatar2 from "../../../public/assets/avatars/2.png";
import imageAvatar3 from "../../../public/assets/avatars/3.png";
import imageCrabShell from "../../../public/assets/items/crab_shell.png";
import imageHoney from "../../../public/assets/items/honey.png";
import imageCow from "../../../public/assets/npcs/cow.png";
import imageTree from "../../../public/assets/tiles/location/tree_1.png";

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

function InteractiveListItem({ thing }: { thing: InteractiveThing }) {
  return (
    <li className="flex justify-between border-b border-px">
      <div className="flex">
        <img
          style={{ imageRendering: "pixelated" }}
          className="w-10 h-10"
          height="38"
          width="38"
          src={thing.img}
        />
        <a className="pt-2 whitespace-nowrap" href="">
          {thing.name}
        </a>
      </div>
      {thing.players.length > 0 && (
        <>
          <progress className="mx-3 mt-4 progress progress-primary w-1/3"></progress>
          <div className="flex pr-2">
            {thing.players.map((player) => (
              <img
                className="w-10 h-10"
                width="38"
                height="38"
                draggable={false}
                style={{
                  userSelect: "none",
                  imageRendering: "pixelated",
                }}
                src={player.img}
              />
            ))}
          </div>
        </>
      )}
      {thing.actions.length > 0 && (
        <div className="pt-1 ml-auto pr-2">
          {thing.actions.map((action) => (
            <Link
              key={action.name}
              className="ml-2 mt-1 btn btn-primary btn-xs"
              to="/game"
            >
              {action.name}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

type Player = { name: string; img: string };
type Action = { name: string; disabled: boolean };

type InteractiveThing = {
  img: string;
  name: string;
  actions: Action[];
  players: Player[];
};

function InteractiveList() {
  const thing1 = {
    img: imageCow,
    name: "Cow (3)",
    inAction: true,
    actions: [{ name: "Attack", disabled: false }],
    players: [],
  };
  const thing2 = {
    img: imageCow,
    name: "Cow (2)",
    inAction: false,
    actions: [],
    players: [
      { name: "dragonslayer234", img: imageAvatar1 },
      { name: "dragonkiller1", img: imageAvatar2 },
    ],
  };
  const thing3 = {
    img: imageTree,
    name: "Tree",
    inAction: false,
    actions: [{ name: "Cut", disabled: false }],
    players: [{ name: "killer33", img: imageAvatar3 }],
  };
  return (
    <ul className="text-sm">
      <InteractiveListItem thing={thing1} />
      <InteractiveListItem thing={thing2} />
      <div className="mb-5">
        <InteractiveListItem thing={thing3} />
      </div>
    </ul>
  );
}

type Item = { img: string; name: string; canPickUp: boolean };

function ItemListItem({ item }: { item: Item }) {
  return (
    <li className="flex border-b border-px">
      <img
        style={{ imageRendering: "pixelated" }}
        height="38"
        width="38"
        src={item.img}
      />
      <a className="pt-2" href="">
        {item.name}
      </a>
      {item.canPickUp && (
        <div className="pt-1 ml-auto pr-2">
          <Link className="ml-2 mt-1 btn btn-primary btn-xs" to="/game">
            Pick up
          </Link>
        </div>
      )}
    </li>
  );
}

function ItemList() {
  const item1 = { name: "Honey", img: imageHoney, canPickUp: true };
  const item2 = { name: "Crab Shell", img: imageCrabShell, canPickUp: true };
  return (
    <ul className="text-sm">
      <ItemListItem item={item1} />
      <ItemListItem item={item2} />
    </ul>
  );
}

export default function Index() {
  return (
    <div className="overflow-auto">
      <h1 className="text-lg font-bold">Clearview - Meadows</h1>
      <div className="mb-5">
        <span className="text-sm">You feel the sun shining on your neck.</span>
      </div>
      <InteractiveList />
      <h2 className="font-bold">Items</h2>
      <ItemList />
    </div>
  );
}
