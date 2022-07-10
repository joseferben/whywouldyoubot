import { FetcherWithComponents } from "@remix-run/react";
import { useEffect } from "react";

export function useRefresher(
  eventApiPath: string,
  refreshPath: string,
  event: string,
  fetcher: FetcherWithComponents<any>
) {
  useEffect(() => {
    const source = new EventSource(eventApiPath, { withCredentials: true });
    source.addEventListener(event, (_: any) => {
      console.log("get event");
      if (fetcher.type === "init" || fetcher.type === "done") {
        console.log("refreshing page");
        fetcher.load(refreshPath);
      }
    });
    source.onerror = (e) => {
      console.error(e);
      source.close();
    };
  }, []);
}
