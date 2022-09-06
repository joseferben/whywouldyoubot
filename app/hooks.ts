import { FetcherWithComponents } from "@remix-run/react";
import { useEffect } from "react";

type Page = "/game" | "/game/index";

const EVENT_NAME = "refresh";
const REFRESH_API_PATH = "/api/refresh";

export function useRefresh(fetcher: FetcherWithComponents<any>, page?: Page) {
  useEffect(() => {
    const source = new EventSource(REFRESH_API_PATH, {
      withCredentials: true,
    });
    source.addEventListener(EVENT_NAME, (_: any) => {
      if (fetcher.type === "init" || fetcher.type === "done") {
        console.log("refresh page");
        fetcher.load(page || "/game");
      }
    });
    source.onerror = (e) => {
      console.error(e);
      source.close();
    };
  }, []);
}
