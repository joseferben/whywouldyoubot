/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";
import { BotsScreen } from "~/components/BotsScreen";
import { useEffect } from "react";

function InventoryScreen() {
  return <div>Inventory</div>;
}

function CharacterScreen() {
  return <div>Character</div>;
}

function SettingsScreen() {
  return (
    <a href="/logout" className="btn-error btn">
      Logout
    </a>
  );
}

function Screen() {
  const store = useGameStore();
  const [activeMenu, setActiveMenu] = useStore(store, (state) => [
    state.activeMenu,
    state.setActiveMenu,
  ]);

  let screen = null;
  let title = null;
  let subtitle = null;
  if (activeMenu === "inventory") {
    screen = <InventoryScreen />;
    title = "Inventory";
  } else if (activeMenu === "character") {
    screen = <CharacterScreen />;
    title = "Character";
  } else if (activeMenu === "bots") {
    screen = <BotsScreen />;
    title = "Bots";
    subtitle = "Create and manage your bots.";
  } else if (activeMenu === "settings") {
    screen = <SettingsScreen />;
    title = "Settings";
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "1":
          if (activeMenu === "inventory") {
            setActiveMenu(null);
          } else {
            setActiveMenu("inventory");
          }
          break;
        case "2":
          if (activeMenu === "character") {
            setActiveMenu(null);
          } else {
            setActiveMenu("character");
          }
          break;
        case "3":
          if (activeMenu === "bots") {
            setActiveMenu(null);
          } else {
            setActiveMenu("bots");
          }
          break;
        case "4":
          if (activeMenu === "settings") {
            setActiveMenu(null);
          } else {
            setActiveMenu("settings");
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setActiveMenu, activeMenu]);

  return (
    activeMenu && (
      <div className="rounded-box fixed bottom-2 right-2 z-50 ml-2 h-[600px] w-full bg-base-200 px-4 py-3 shadow-lg sm:ml-5 sm:w-96 md:bottom-5 md:right-5">
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            <span className="text-sm leading-6 text-gray-500">{subtitle}</span>
          </div>
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
        </div>
        <div className="mt-4 px-1 py-3">{screen}</div>
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
    <div>
      <Screen />
      <div className="fixed bottom-5 right-5">
        <Navigation />
      </div>
    </div>
  );
}
