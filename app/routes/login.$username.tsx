import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { pickRandom } from "~/engine/math";
import { container } from "~/container.server";

interface ActionData {
  error?: string;
}

interface LoaderData {
  username: string;
  greeting: string;
}

function randomGreeting() {
  return pickRandom(["Welcome back", "Howdy", "Greetings", "Good day"]);
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const username = params.username;
  if (!username) return redirect("/");
  const user = container.userService.findByUsername(username);
  if (!user || !user.password) return redirect("/");

  return json<LoaderData>({
    username: user?.username,
    greeting: randomGreeting(),
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const password = formData.get("password");
  const remember = formData.get("remember");

  const username = params.username;
  if (!username) return redirect("/");

  if (typeof password !== "string" || password.length === 0) {
    return json<ActionData>(
      { error: "Password is required." },
      { status: 400 }
    );
  }

  const user = container.userService.verifyLogin(username, password);

  if (!user) {
    return json<ActionData>(
      { error: "Invalid password provided." },
      { status: 400 }
    );
  }

  return container.sessionService.createUserSession({
    request,
    userId: user.id,
    remember: remember === "on" ? true : false,
    redirectTo: "/game",
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const { username, greeting } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  useEffect(() => {
    if (actionData?.error) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold">
            {greeting} {username}!
          </h1>
        </div>
        <Form method="post" className="space-y-6">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              ref={passwordRef}
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={actionData?.error ? true : undefined}
              aria-describedby="password-error"
              className="input input-bordered w-full max-w-xs"
            />
            {actionData?.error && (
              <div className="pt-1 text-red-700" id="password-error">
                {actionData.error}
              </div>
            )}
          </div>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Remember password for a week?</span>
            </label>
            <input
              type="checkbox"
              className="toggle"
              name="remember"
              defaultChecked
            />
          </div>
          <button type="submit" className="btn btn-primary mr-2">
            Play
          </button>
        </Form>
      </div>
    </div>
  );
}
