import { validateName } from "@wwyb/core";
import { useState } from "react";
import { useStore } from "zustand";
import { useGameStore } from "~/store";

export function BotsScreen() {
  const store = useGameStore();
  const [botName, setBotName] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const [bots, createBot] = useStore(store, (state) => [
    state.bots,
    state.createBot,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setError(validateName(name));
    setBotName(name);
  };

  const handleBotCreation = async () => {
    if (!error) {
      setLoading(true);
      await createBot(botName);
      setLoading(false);
      setBotName("");
      setError(null);
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
          className={`btn-primary join-item btn rounded-r-full ${
            loading ? "loading loading-spinner" : ""
          }`}
        >
          Create bot
        </button>
      </div>
      <small className="text-error">{error}</small>
      <div className="divider"></div>
      {bots.length === 0 ? (
        <div className="text-center text-sm text-gray-500">
          You don't have any bots yet 🤖
        </div>
      ) : (
        bots.map((bot) => <div key={bot.id}>{bot.name}</div>)
      )}
    </div>
  );
}
