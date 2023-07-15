import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { Client, catchRemixResponse } from "@wwyb/sdk";
import { loader as state } from "~/routes/api.state";
import { action as botsCreate } from "~/routes/api.bots.create";
import { action as botsDelete } from "~/routes/api.bots.delete";
import { action as walk } from "~/routes/api.walk";

export type Opts = {
  apiKey: string;
};

export class RemixTestClient extends Client {
  routeMap: { [key: string]: ActionFunction | LoaderFunction };

  constructor(readonly opts: Opts) {
    super(opts);
    this.routeMap = {
      "/api/state/": state,
      "/api/bots/create/": botsCreate,
      "/api/bots/delete/": botsDelete,
      "/api/walk/": walk,
    };
  }

  protected async fetch(
    path: string,
    opts?: {
      method?: string;
      body?: string;
      headers?: { [key: string]: string };
    }
  ): Promise<Response> {
    const handler = this.routeMap[path];
    if (handler) {
      const request = new Request("http://validurl", opts);
      return catchRemixResponse(() =>
        handler({ request, context: {}, params: {} })
      );
    } else {
      throw new Error(`No loader found for path ${path}`);
    }
  }
}
