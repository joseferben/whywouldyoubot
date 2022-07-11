import type {
    ActionFunction,
    LoaderFunction,
    MetaFunction
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";
import { createUser, getUserByName } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateName } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const userId = await getUserId(request);
  if (userId || !name) return redirect("/");
  return json({});
};

interface ActionData {
  errors: {
    password?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/game");

  if (password !== passwordConfirmation) {
    return json<ActionData>(
      { errors: { password: "Passwords don't match" } },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length === 0) {
    return json<ActionData>(
      { errors: { password: "Password is required" } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json<ActionData>(
      { errors: { password: "Password is too short" } },
      { status: 400 }
    );
  }

  if (!validateName(name)) {
    return redirect("/");
  }

  const existingUser = await getUserByName(name);
  if (existingUser) {
    return redirect("/");
  }

  const user = await createUser(name, password);

  return createUserSession({
    request,
    userId: user.entityId,
    remember: false,
    redirectTo,
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const name = searchParams.get("name") ?? undefined;
  const actionData = useActionData() as ActionData;
  const passwordRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Hello {name} ⚔️</h1>
        </div>
        <Form method="post" className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="block text-sm font-medium text-gray-700"
            >
              Password confirmation
            </label>
            <div className="mt-1">
              <input
                id="password-confirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
              />
              {actionData?.errors?.password && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={redirectTo} />
          <input type="hidden" name="name" value={name} />
          <button
            type="submit"
            className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Create Account
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
