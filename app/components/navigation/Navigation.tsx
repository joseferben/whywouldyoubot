import { NavLink } from "@remix-run/react";
import imageGold from "../../../public/assets/items/gold.png";

export default function Navigation() {
  return (
    <div className="p-1 mb-1 flex justify-between">
      <div className="flex">
        <NavLink
          to="/game"
          className={({ isActive }) =>
            `btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Field
        </NavLink>
        <NavLink
          to="/game/inventory"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Inventory
        </NavLink>
        <NavLink
          to="/game/character"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Character
        </NavLink>
        <NavLink
          to="/game/settings"
          className={({ isActive }) =>
            `ml-1 btn btn-xs ${isActive ? "btn-active" : ""}`
          }
        >
          Settings
        </NavLink>
      </div>
      <div className="ml-1 flex">
        <img style={{ imageRendering: "pixelated" }} src={imageGold}></img>
        <span className="font-bold">450</span>
      </div>
    </div>
  );
}
