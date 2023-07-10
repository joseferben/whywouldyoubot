import { Form, useActionData, useLoaderData } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json, redirect } from "@remix-run/server-runtime";
import type { Player } from "@wwyb/core";
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

export default function Index() {
  const { name, player } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;

  return (
    <div>
      {/* Hero */}
      <div className="min-h-screen bg-base-200 md:pt-32 lg:pt-64">
        <div className="hero-content mx-auto flex-col lg:flex-row-reverse">
          <div className="mr-5 mt-12">
            <h1 className="text-5xl font-bold">Build Your Bot</h1>
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
                  className="input-bordered input"
                />

                <button type="submit" className="btn-primary btn">
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
    </div>
  );
}
