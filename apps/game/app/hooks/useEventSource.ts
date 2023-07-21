import { useEffect, useState, useRef } from "react";

// Based on https://github.com/sergiodxa/remix-utils/blob/main/src/react/use-event-source.tsx

type EventSourceOptions = {
  init?: EventSourceInit;
  event?: string;
  checkInterval?: number;
};

export function useEventSource(
  url: string | URL,
  { event = "message", init, checkInterval = 1000 }: EventSourceOptions = {}
) {
  const [data, setData] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Function to initialize the EventSource
    function initEventSource() {
      console.log("initEventSource", url, init);
      eventSourceRef.current = new EventSource(url, init);
      eventSourceRef.current.addEventListener(event ?? "message", handler);
    }

    function handler(event: MessageEvent) {
      setData(event.data || "UNKNOWN_EVENT_DATA");
    }

    // Initialize the EventSource for the first time
    initEventSource();

    // Set up an interval to check the EventSource connection
    const checkIntervalId = setInterval(() => {
      if (eventSourceRef?.current?.readyState === EventSource.CLOSED) {
        console.log("EventSource connection lost, reconnecting...");
        initEventSource();
      }
    }, checkInterval);

    // Clean up
    return () => {
      eventSourceRef?.current?.removeEventListener(event ?? "message", handler);
      eventSourceRef?.current?.close();
      clearInterval(checkIntervalId);
    };
  }, [url, event, init, checkInterval]);

  return data;
}
