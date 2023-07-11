/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";

function Navigation() {
  const store = useGameStore();
  const [activeMenu, setActiveMenu] = useStore(store, (state) => [
    state.activeMenu,
    state.setActiveMenu,
  ]);

  return (
    <ul className="menu rounded-box space-y-1 bg-base-200 text-base">
      <li>
        <button
          className={activeMenu === "inventory" ? "focus" : ""}
          onClick={() => setActiveMenu("inventory")}
        >
          <img className="h-5 w-5" src="/assets/ui/inventory.png" />
          Inventory
        </button>
      </li>
      <li>
        <button
          className={activeMenu === "character" ? "focus" : ""}
          onClick={() => setActiveMenu("character")}
        >
          <img className="h-5 w-5" src="/assets/ui/character.png" />
          Character
        </button>
      </li>
      <li>
        <button
          className={activeMenu === "bots" ? "focus" : ""}
          onClick={() => setActiveMenu("bots")}
        >
          <img className="h-5 w-5" src="/assets/ui/settings.png" />
          Bots
        </button>
      </li>
      <li>
        <button
          className={activeMenu === "settings" ? "focus" : ""}
          onClick={() => setActiveMenu("settings")}
        >
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
