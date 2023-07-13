import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { PlayerImage } from "~/components/PlayerImage";
import { container } from "~/container.server";

export const loader = async ({ request }: LoaderArgs) => {
  const player = await container.authService.ensurePlayer(request);
  container.onlineService.ensureOnline(player);
  const heads = await container.characterCustomizationService.findHeads();
  const eyes = await container.characterCustomizationService.findEyes();
  const hair = await container.characterCustomizationService.findHair();
  const customization =
    container.characterCustomizationService.findCustomization(player);
  return json({
    player,
    heads,
    eyes,
    hair,
    customization,
  });
};

export const action = async ({ request }: ActionArgs) => {
  const player = await container.authService.ensurePlayer(request);
  const formData = await request.formData();
  const eyes = formData.get("eyes");
  const head = formData.get("head");
  const hair = formData.get("hair");

  invariant(
    typeof eyes === "string" &&
      typeof head === "string" &&
      typeof hair === "string"
  );

  container.characterCustomizationService.setCustomization(player, {
    eyes: parseInt(eyes),
    head: parseInt(head),
    hair: parseInt(hair),
  });

  return redirect("/");
};

export const meta: V2_MetaFunction = () => {
  return [
    {
      title: "Customize Character",
    },
  ];
};

function ArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function BodyPartSlider({
  name,
  value,
  setValue,
  available,
}: {
  name: string;
  value: number;
  setValue: any;
  available: number;
}) {
  return (
    <div className="flex">
      <button
        onClick={() => setValue(mod(value - 1, available))}
        className="btn"
      >
        <ArrowLeft />
      </button>
      <img
        className="h-16 w-16"
        alt={name}
        style={{ imageRendering: "pixelated" }}
        height="16"
        width="16"
        src={`/assets/avatars/${name}_${value}.png`}
      />
      <button
        onClick={() => setValue(mod(value + 1, available))}
        className="btn"
      >
        <ArrowRight />
      </button>
    </div>
  );
}

export default function SetAvatar() {
  const {
    player,
    customization,
    eyes: availableEyes,
    heads: availableHeads,
    hair: availableHair,
  } = useLoaderData<typeof loader>();
  const [eyes, setEyes] = useState<number>(customization.eyes);
  const [hair, setHair] = useState<number>(customization.hair);
  const [head, setHead] = useState<number>(customization.head);

  function randomize() {
    setEyes(Math.floor(Math.random() * availableEyes.length));
    setHair(Math.floor(Math.random() * availableHair.length));
    setHead(Math.floor(Math.random() * availableHeads.length));
  }

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8 md:px-0">
        <div className="mb-12">
          <h1 className="text-5xl font-bold">
            Hello there, {player.username} 👋
          </h1>
        </div>
        <div className="flex justify-between">
          <div>
            <BodyPartSlider
              name="hair"
              value={hair}
              setValue={setHair}
              available={availableHair.length}
            />
            <BodyPartSlider
              name="eyes"
              value={eyes}
              setValue={setEyes}
              available={availableEyes.length}
            />
            <BodyPartSlider
              name="head"
              value={head}
              setValue={setHead}
              available={availableHeads.length}
            />
            <Form method="post" className="mt-8">
              <input type="hidden" name="eyes" value={eyes} />
              <input type="hidden" name="head" value={head} />
              <input type="hidden" name="hair" value={hair} />
              <Link onClick={randomize} className="btn mb-2 mr-2" to={""}>
                Randomize
              </Link>
              <button type="submit" className="btn-primary btn">
                Save
              </button>
            </Form>
            <small className="text-sm leading-snug text-gray-400">
              Don't worry, you can change your look later in the game.
            </small>
          </div>
          <div className="relative aspect-square h-32 w-32">
            <PlayerImage {...{ hair, head, eyes }} />
          </div>
        </div>
      </div>
    </div>
  );
}
