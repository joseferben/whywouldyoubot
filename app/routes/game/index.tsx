import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import { getMiniMapByUser } from "~/minimap.server";
import { requireUserId } from "~/session.server";
import imageCow from "../../../public/assets/npcs/cow.png";

type LoaderData = {
  miniMap: Awaited<ReturnType<typeof getMiniMapByUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const miniMap = await getMiniMapByUser(userId);
  return json<LoaderData>({ miniMap });
};

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

function Field() {
  return (
    <>
      <h1 className="text-lg font-bold">Clearview - Meadows</h1>
      <span className="text-sm">You feel the sun shining on your neck.</span>
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
          <a className="ml-2 btn-link" href="">
            Attack
          </a>
        </li>
      </ul>
    </>
  );
}

export default function Main() {
  const { miniMap } = useLoaderData() as LoaderData;

  return (
    <>
      <div className="h-full">
        <Field />
      </div>
      <div className="h-1/3 mb-1">
        <Map miniMap={miniMap} />
      </div>
    </>
  );
}
