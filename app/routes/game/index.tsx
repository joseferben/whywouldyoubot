import { Form, Link, useLoaderData } from "@remix-run/react";
import {
  ActionFunction,
  json,
  LoaderFunction
} from "@remix-run/server-runtime";
import {
  Field,
  getField,
  getInteractives,
  getItems,
  handleAction,
  Interactive,
  Item
} from "~/field.server";
import { requireUser } from "~/session.server";

type LoaderData = {
  interactives: Interactive[];
  items: Item[];
  field: Field;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);
  const [items, interactives, field] = await Promise.all([
    getItems(user),
    getInteractives(user),
    getField(user),
  ]);
  return json<LoaderData>({ interactives, items, field });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action");
  const thingId = formData.get("thingId");
  if (
    action &&
    thingId &&
    typeof action === "string" &&
    typeof thingId === "string"
  ) {
    await handleAction(user, action, thingId);
  }
};

function Interactive({ interactive }: { interactive: Interactive }) {
  return (
    <li className="flex justify-between border-b border-px">
      <div className="flex">
        <img
          style={{ imageRendering: "pixelated" }}
          className="w-10 h-10"
          height="38"
          width="38"
          src={interactive.img}
        />
        <a className="pt-2 whitespace-nowrap" href="#">
          {interactive.name}
        </a>
        {interactive.actions.length > 0 && (
          <div className="pt-1 ml-auto pr-2">
            {interactive.actions.map((action) => (
              <Form key={action.name} className="flex p-1" method="post">
                <input type="hidden" name="id" value={action.thingId} />
                <input type="hidden" name="action" value={action.name} />
                <button
                  type="submit"
                  className="ml-2 mt-1 btn btn-primary btn-xs"
                >
                  {action.label}
                </button>
              </Form>
            ))}
          </div>
        )}
      </div>
      {interactive.players.length > 0 && (
        <>
          <progress className="mx-3 mt-4 progress progress-primary w-1/3"></progress>
          <div className="flex pr-2">
            {interactive.players.map((player) => (
              <img
                key={player.name}
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
    </li>
  );
}

function InteractiveList({ interactives }: { interactives: Interactive[] }) {
  return (
    <ul className={`text-sm ${interactives.length > 0 ? "mb-5" : ""}`}>
      {interactives.map((interactive) => (
        <Interactive key={interactive.id} interactive={interactive} />
      ))}
    </ul>
  );
}

function Item({ item }: { item: Item }) {
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
        <div className="pt-1 pr-2">
          <Link className="ml-2 mt-1 btn btn-primary btn-xs" to="/game">
            Pick up
          </Link>
        </div>
      )}
    </li>
  );
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul className="text-sm">
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ul>
  );
}

export default function Index() {
  const { interactives, items, field } = useLoaderData() as LoaderData;
  return (
    <div className="overflow-auto">
      <h1 className="text-lg font-bold">
        {field.region} - {field.location}
      </h1>
      <div className="mb-5">
        <span className="text-sm">{field.description}</span>
      </div>
      <InteractiveList interactives={interactives} />
      <h2 className="font-bold">Items</h2>
      <ItemList items={items} />
    </div>
  );
}
