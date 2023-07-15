import { Client } from "./Client";
import type { ServerEvent } from "@wwyb/core";

type BotState = {};

export type Opts = {
  apiKey: string;
  baseUrl: string;
};

export class Bot {
  initialized: boolean;
  client: Client;

  constructor(readonly opts: Opts | Client) {
    if (opts instanceof Client) {
      this.client = opts;
    } else {
      this.client = new Client(opts);
    }
    this.initialized = false;
  }

  private async ensureInitialized() {
    if (this.initialized) {
      return;
    }
    await this.client.fetchState();
    this.initialized = true;
  }

  async onTick(cb: (state: BotState) => Promise<void>) {
    await this.ensureInitialized();
  }

  async onEvent(cb: (state: BotState, event: ServerEvent) => Promise<void>) {
    await this.ensureInitialized();
  }
}
