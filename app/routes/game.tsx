import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import {
    ChatMessage,
    createChatMessage,
    getChatMessagesByUser
} from "~/models/chat.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  chatMessages: Awaited<ReturnType<typeof getChatMessagesByUser>>;
};

interface ActionData {
  errors?: {
    message?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const message = formData.get("message");

  if (typeof message !== "string" || message.length > 200) {
    return json<ActionData>(
      { errors: { message: "Chat message too long" } },
      { status: 400 }
    );
  }

  await createChatMessage({ message, userId });
  return redirect("/game");
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const chatMessages = await getChatMessagesByUser(userId);

  return json<LoaderData>({ chatMessages });
};

export default function NotesPage() {
  const data = useLoaderData() as LoaderData;
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <Form action="/logout" method="post">
        <button
          type="submit"
          className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
        >
          Logout
        </button>
      </Form>

      <main className="flex h-full bg-white">
        <div className="flex-1 p-6">
          <Outlet />
          <div className="mx-auto">
            <ul>
              {data.chatMessages.map((d: ChatMessage) => (
                <li>
                  <span className="font-bold">{d.userId}:</span>
                  {d.message}
                </li>
              ))}
            </ul>
            <Form method="post" className="h-64">
              <input
                type="text"
                name="message"
                className="rounded border border-gray-500 px-2 py-1 text-lg"
              ></input>
              <button
                type="submit"
                className="rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
              >
                Say
              </button>
            </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
