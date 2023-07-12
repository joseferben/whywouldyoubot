/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";

function Inventory() {
  return <div>Inventory</div>;
}

function Character() {
  return <div>Character</div>;
}

function Bots() {
  return <div>Bots</div>;
}

function Settings() {
  return <div>Settings</div>;
}

function Screen() {
  const store = useGameStore();
  const [activeMenu, setActiveMenu] = useStore(store, (state) => [
    state.activeMenu,
    state.setActiveMenu,
  ]);
  let screen = null;
  if (activeMenu === "inventory") {
    screen = <Inventory />;
  } else if (activeMenu === "character") {
    screen = <Character />;
  } else if (activeMenu === "bots") {
    screen = <Bots />;
  } else if (activeMenu === "settings") {
    screen = <Settings />;
  }

  return (
    activeMenu && (
      <div className="fixed bottom-2 left-2 right-2 z-50 flex flex-row-reverse md:bottom-5 md:left-5 md:right-5">
        <div className="rounded-box h-[600px] w-full bg-base-200 px-3 py-2 shadow-lg sm:w-96">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-8 w-8 cursor-pointer hover:text-gray-500"
            onClick={() => setActiveMenu(null)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="py-3">{screen}</div>
        </div>
      </div>
    )
  );
}

function Navigation() {
  const store = useGameStore();
  const [setActiveMenu] = useStore(store, (state) => [state.setActiveMenu]);

  return (
    <ul className="menu rounded-box space-y-1 bg-base-200 text-base shadow-lg">
      <li>
        <button onClick={() => setActiveMenu("inventory")}>
          <img className="h-5 w-5" src="/assets/ui/inventory.png" />
          Inventory
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("character")}>
          <img className="h-5 w-5" src="/assets/ui/character.png" />
          Character
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("bots")}>
          <img className="h-5 w-5" src="/assets/ui/bots.png" />
          Bots
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("settings")}>
          <img className="h-5 w-5" src="/assets/ui/settings.png" />
          Settings
        </button>
      </li>
    </ul>
  );
}

export function Menu() {
  return (
    <div className="relative">
      <Screen />
      <div className="fixed bottom-5 right-5">
        <Navigation />
      </div>
    </div>
  );
}
