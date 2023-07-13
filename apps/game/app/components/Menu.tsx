/* eslint-disable jsx-a11y/alt-text */
import { useStore } from "zustand";
import { useGameStore } from "~/store";
import { BotsScreen } from "~/components/BotsScreen";
import { useEffect } from "react";
import { PlayerImage } from "./PlayerImage";

function InventoryScreen() {
  return <div>Inventory</div>;
}

function CharacterScreen() {
  return (
    <a href="/customize" className="btn-secondary btn">
      Customize
    </a>
  );
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
      if (activeMenu !== null) return;

      switch (e.key) {
        case "1":
          setActiveMenu("inventory");
          break;
        case "2":
          setActiveMenu("character");
          break;
        case "3":
          setActiveMenu("bots");
          break;
        case "4":
          setActiveMenu("settings");
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
      <div className="fixed bottom-0 right-0 z-50 ml-2 h-[600px] w-full bg-base-200 px-4 py-3 shadow-lg sm:rounded-box sm:bottom-5 sm:right-5 sm:ml-5 sm:w-96">
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
  const [player, setActiveMenu] = useStore(store, (state) => [
    state.players.get(state.me),
    state.setActiveMenu,
  ]);

  return (
    <ul className="menu rounded-box space-y-1 bg-base-200 text-base shadow-lg">
      <li>
        <button onClick={() => setActiveMenu("inventory")}>
          <img
            className="h-6 w-6"
            src="/assets/ui/inventory.png"
            style={{ imageRendering: "pixelated", userSelect: "none" }}
          />
          Inventory
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("character")}>
          <div className="-m-2 h-10 w-10">
            <PlayerImage
              eyes={player?.avatarEyes}
              hair={player?.avatarHair}
              head={player?.avatarHead}
            />
          </div>
          Character
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("bots")}>
          <img
            className="h-6 w-6"
            src="/assets/ui/bots.png"
            style={{ imageRendering: "pixelated", userSelect: "none" }}
          />
          Bots
        </button>
      </li>
      <li>
        <button onClick={() => setActiveMenu("settings")}>
          <img
            className="h-6 w-6"
            src="/assets/ui/settings.png"
            style={{ imageRendering: "pixelated", userSelect: "none" }}
          />
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
