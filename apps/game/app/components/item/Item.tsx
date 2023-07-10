import { Form } from "@remix-run/react";
import type { CombatStat, Effect } from "~/engine/core/item";

export type Props = {
  item: {
    name: string;
    amount: number;
    effects: Effect[];
    img: string;
    kind: string;
  };
};

export function combatStatIcon(stat: CombatStat) {
  // TODO add tooltip
  if (stat === "Health") {
    return (
      <img
        width="16"
        height="16"
        alt=""
        className="mr-1 h-5 w-5"
        style={{ imageRendering: "pixelated" }}
        src={"/assets/ui/heart.png"}
      ></img>
    );
  } else if (stat === "Attack") {
    return (
      <img
        width="16"
        height="16"
        alt=""
        className="mr-1 h-5 w-5"
        style={{ imageRendering: "pixelated" }}
        src={"/assets/ui/attack.png"}
      ></img>
    );
  } else if (stat === "Defense") {
    return (
      <img
        width="16"
        height="16"
        alt=""
        className="mr-1 h-5 w-5"
        style={{ imageRendering: "pixelated" }}
        src={"/assets/ui/defense.png"}
      ></img>
    );
  } else if (stat === "Intelligence") {
    return (
      <img
        width="16"
        height="16"
        alt=""
        className="mr-1 h-5 w-5"
        style={{ imageRendering: "pixelated" }}
        src={"/assets/ui/intelligence.png"}
      ></img>
    );
  }
}

export default function Item({ item }: Props) {
  return (
    <div className="flex">
      <img
        className="h-10 w-10"
        alt={item.name}
        style={{ imageRendering: "pixelated" }}
        height="16"
        width="16"
        src={"/" + item.img}
      />
      <div className="ml-1">
        <Form method="post">
          <input type="hidden" name="type" value="inspect-item" />
          <input type="hidden" name="kind" value={item.kind} />
          <button type="submit">
            {item.amount > 1 && <span>x{item.amount}</span>} {item.name}
          </button>
        </Form>
        <div className="flex">
          {item.effects.map(([stat, amount]) => (
            <div
              key={stat}
              className={`mr-2 text-sm ${
                amount < 0 ? "text-error" : "text-success"
              }`}
            >
              <div className="flex">
                {combatStatIcon(stat)} {amount < 0 ? "-" : "+"}
                {amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
