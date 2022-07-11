import { Form, Link, useActionData } from "@remix-run/react";
import { ActionFunction, json, redirect } from "@remix-run/server-runtime";
import { getUserByName } from "~/models/user.server";
import { useOptionalUser, validateName } from "~/utils";

interface ActionData {
  errors?: {
    name?: string;
  };
}

function rpgName() {
  const npcs = ["dragon", "beast", "wolf", "golem", "witcher", "bear"];
  const jobs = ["destroyer", "killer", "hunter"];
  const npc = npcs[Math.floor(Math.random() * npcs.length)];
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const num = Math.round(Math.random() * 9999);
  return `${npc}${job}${num}`;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");

  if (!validateName(name)) {
    return json<ActionData>(
      { errors: { name: "This name is invalid" } },
      { status: 400 }
    );
  }

  const existingUser = await getUserByName(name);
  if (existingUser) {
    return json<ActionData>(
      { errors: { name: "A user with that name already exists" } },
      { status: 400 }
    );
  }

  const searchParams = new URLSearchParams([["name", name]]);
  return redirect(`/join?${searchParams}`);
};

export default function Index() {
  const user = useOptionalUser();
  const actionData = useActionData() as ActionData;

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="relative sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="/images/map_hero_1.png"
                alt="Sonic Youth On Stage"
              />
              <div className="absolute inset-0 bg-[color:rgba(254,204,27,0.5)] mix-blend-multiply" />
            </div>
            <div className="relative px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-14 lg:px-8 lg:pb-20 lg:pt-32">
              <h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
                <span className="block uppercase text-yellow-500 drop-shadow-md">
                  Untitled Game
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg font-bold text-center text-xl text-white sm:max-w-3xl">
                This MMORPG runs in your browser. Explore the world, slay
                monsters, find treasures, amass wealth as a merchant or just
                simply enjoy the breeze on the meadows.
              </p>
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                {user ? (
                  <Link
                    to="/game"
                    className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-1 text-base font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 sm:px-8"
                  >
                    Play as {user.name}
                  </Link>
                ) : (
                  <Form
                    className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0"
                    method="post"
                  >
                    <input
                      className="w-full rounded border border-gray-500 px-4 py-2 text-lg"
                      type="text"
                      name="name"
                      defaultValue={rpgName()}
                    ></input>
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-md bg-yellow-500 px-4 py-1 font-medium text-white hover:bg-yellow-600  "
                    >
                      Join
                    </button>
                    {actionData?.errors?.name && (
                      <div
                        className="font-bold text-xs pt-1 text-red-100"
                        id="name-error"
                      >
                        {actionData.errors.name}
                      </div>
                    )}
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl py-2 px-4 sm:px-6 lg:px-8">
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            <ul>
              <li>Pets</li>
              <li>Monsters</li>
              <li>Fighting</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
