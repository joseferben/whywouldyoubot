/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";

function Navigation() {
  const store = useGameStore();
  const [openMenu] = useStore(store, (state) => [state.openMenu]);

  return (
    <ul className="menu rounded-box bg-base-200 lg:menu-horizontal">
      <li>
        <button className={openMenu === "inventory" ? "active" : ""}>
          <img className="h-5 w-5" src="/assets/ui/inventory.png" />
          Inventory
        </button>
      </li>
      <li>
        <button className={openMenu === "character" ? "active" : ""}>
          <img className="h-5 w-5" src="/assets/ui/character.png" />
          Updates
          <span className="badge badge-warning badge-sm">NEW</span>
        </button>
      </li>
      <li>
        <button className={openMenu === "settings" ? "active" : ""}>
          Stats
          <span className="badge badge-info badge-xs"></span>
        </button>
      </li>
    </ul>
  );
}

export function Menu() {
  return <Navigation></Navigation>;
}
