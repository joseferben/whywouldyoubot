/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";

function Navigation() {
  const store = useGameStore();
  const [openMenu] = useStore(store, (state) => [state.openMenu]);

  return (
    <ul className="menu rounded-box bg-base-200 text-base lg:menu-horizontal">
      <li>
        <button className={openMenu === "inventory" ? "active" : ""}>
          <img className="h-5 w-5" src="/assets/ui/inventory.png" />
          Inventory
        </button>
      </li>
      <li>
        <button className={openMenu === "character" ? "active" : ""}>
          <img className="h-5 w-5" src="/assets/ui/character.png" />
          Character
        </button>
      </li>
      <li>
        <button className={openMenu === "settings" ? "active" : ""}>
          <img className="h-5 w-5" src="/assets/ui/settings.png" />
          Settings
        </button>
      </li>
    </ul>
  );
}

export function Menu() {
  return <Navigation></Navigation>;
}
