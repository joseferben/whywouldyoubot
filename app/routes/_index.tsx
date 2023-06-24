import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import type { Player } from "~/engine/core";
import { container } from "~/container.server";
import { safeRedirect, validateName } from "~/utils";

interface ActionData {
  errors?: {
    name?: string;
  };
}

type LoaderData = {
  name: string;
  player: Player | null;
};

function rpgName() {
  const npcs = ["dragon", "beast", "wolf", "golem", "witcher", "bear"];
  const jobs = ["destroyer", "killer", "hunter"];
  const npc = npcs[Math.floor(Math.random() * npcs.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const num = Math.round(Math.random() * 9999);
  return `${npc}${job}${num}`;
}

export const loader: LoaderFunction = async ({ request }) => {
  const player = await container.sessionService.getPlayer(request);
  return json<LoaderData>({ name: rpgName(), player });
};

export const action: ActionFunction = async ({ request }) => {
  const player = await container.sessionService.getPlayer(request);
  if (player) return redirect("/game");

  const formData = await request.formData();
  const name = formData.get("name");

  if (!validateName(name)) {
    return json<ActionData>(
      { errors: { name: "This name is invalid." } },
      { status: 400 }
    );
  }

  const existingUser = container.userService.findByUsername(name);

  // player exists and has password set => login
  if (existingUser && existingUser.password != null) {
    return redirect(`/login/${existingUser.username}`);
  }

  // player exists and has no password set => no way to recover
  if (existingUser && existingUser.password == null) {
    return json<ActionData>(
      {
        errors: {
          name: "This player exists but has no password set. <br>Please create a new player and set the password, so you can log in later on!",
        },
      },
      { status: 400 }
    );
  }

  // new player => game
  const createdPlayer = container.playerService.create(name);
  const redirectTo = safeRedirect(`/game`);
  return container.sessionService.createUserSession({
    request,
    userId: createdPlayer.userId,
    remember: false,
    redirectTo,
  });
};

function FeatureCard({
  image,
  title,
  description,
}: {
  image: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card bg-base-100 mx-auto mb-6 w-full shadow-xl sm:ml-0 sm:mr-4 sm:w-96">
      <figure>
        <img src={image} alt="The 2d world" />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function Index() {
  const { name, player } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;

  return (
    <div>
      {/* Hero */}
      <div className="bg-base-200 min-h-screen md:pt-32 lg:pt-64">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <img
            alt="Gameplay"
            src="/images/gameplay.png"
            className="rounded-lg shadow-2xl sm:max-w-sm"
          />
          <div className="mr-5 mt-12">
            <h1 className="text-5xl font-bold">Untiled MMORPG</h1>
            <p className="py-6">
              Hunt, farm, cook or trade. With thousands of others, in real-time.
              <br></br>
              No download, no registration. Optimized for mobile.
            </p>
            <Form className="form-control" method="post">
              <div className="input-group">
                <input
                  type="text"
                  name="name"
                  defaultValue={player ? player.username : ""}
                  placeholder={name}
                  className="input input-bordered"
                />

                <button type="submit" className="btn btn-primary">
                  Play
                </button>
              </div>
            </Form>
            {actionData?.errors?.name && (
              <div
                dangerouslySetInnerHTML={{ __html: actionData.errors.name }}
                className="error pt-1 text-xs"
              ></div>
            )}
          </div>
        </div>
      </div>
      {/* Features */}
      <div className="bg-base-200">
        <div className="bg-base-200 container mx-auto px-5 pb-32">
          <h2 className="text-3xl font-bold">Features</h2>
          <div className="mt-5 flex flex-col justify-between sm:flex-row">
            <FeatureCard
              image="/images/world.png"
              title="Real-time on mobile"
              description="A real-time 2d world that works well on mobile."
            />
            <FeatureCard
              image="/images/skills.png"
              title="6 skills"
              description="You can hunt, trade, farm, cook, fish and mix potions."
            />
            <FeatureCard
              image="/images/items.png"
              title="Content"
              description="NPCs, items, quests, and so on."
            />
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <div className="bg-base-200">
        <div className="bg-base-200 container mx-auto px-5 pb-32">
          <h2 className="text-3xl font-bold">Disclaimer</h2>
          <div className="mt-5 lg:w-1/2">
            <p>
              This game is developed by{" "}
              <a href="https://www.joseferben.com">one guy</a>. Everything is
              heavily work in progress. Things will randomly break and you
              probably will lose an item or two until all the bugs are ironed
              out.
            </p>
            <br></br>
            <p>
              I am constantly adding new features and fixing bug. Stay tuned for
              constant updates!
            </p>
          </div>
        </div>
      </div>

      <footer className="footer footer-center bg-base-300 text-base-content p-4">
        <div>
          <p>
            Copyright © 2022 - All right reserved by{" "}
            <a href="https://www.erben.systems">Erben Systems GmbH</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
