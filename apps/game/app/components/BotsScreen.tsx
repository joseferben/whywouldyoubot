import { useState } from "react";
import { useStore } from "zustand";
import { useGameStore } from "~/store";

function validateBotName(name: string): string | null {
  if (name.length < 3) {
    return "Name must be at least 3 characters long";
  }

  if (name.length > 20) {
    return "Name must be at most 20 characters long";
  }

  return null;
}

export function BotsScreen() {
  const store = useGameStore();
  const [botName, setBotName] = useState("");
  const [error, setError] = useState<null | string>(null);

  const [bots, createBot] = useStore(store, (state) => [
    state.bots,
    state.createBot,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setError(validateBotName(name));
    setBotName(name);
  };

  const handleBotCreation = () => {
    if (!error) {
      createBot(botName);
    }
  };

  return (
    <div>
      <div className="join">
        <input
          value={botName}
          onChange={handleInputChange}
          className={`input-bordered input join-item ${
            error ? "input-error" : ""
          }`}
          placeholder="Bot name"
        />
        <button
          onClick={handleBotCreation}
          disabled={!!error}
          className="btn-primary join-item btn rounded-r-full"
        >
          Create bot
        </button>
      </div>
      <small className="text-error">{error}</small>
      <div className="divider"></div>
    </div>
  );
}
