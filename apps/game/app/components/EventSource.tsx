import { useEffect } from "react";
import { useEventSource } from "remix-utils";
import { useStore } from "zustand";
import { useGameStore } from "~/store";

export function EventSource() {
  const store = useGameStore();
  const event = useEventSource("/sse/events", { event: "event" });
  const [handleEvent] = useStore(store, (state) => [state.handleEvent]);

  useEffect(() => {
    if (event) {
      handleEvent(event);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
