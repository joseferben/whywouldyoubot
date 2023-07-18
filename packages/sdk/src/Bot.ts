import { Client } from "./Client";
import {
  deserializeClientState,
  type ClientState,
  type SerializedClientState,
  type ServerEvent,
} from "@wwyb/core";

export type Opts = {
  apiKey: string;
  baseUrl?: string;
};

const defaultBaseUrl = "https://game.whywouldyoubot.gg";

export class Bot {
  initialized: boolean;
  client: Client;
  cb: ((state: ClientState) => Promise<void>) | undefined;

  constructor(clientOrOpts: Client | Opts) {
    if (clientOrOpts instanceof Client) {
      this.client = clientOrOpts;
    } else {
      this.client = new Client({
        apiKey: clientOrOpts.apiKey,
        baseUrl: clientOrOpts.baseUrl || defaultBaseUrl,
      });
    }
    this.initialized = false;
  }

  private async ensureInitialized() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    await this._tick();
    setInterval(async () => {
      await this._tick().catch((e) => {
        console.error(e);
      });
    }, 1000);
  }

  async _tick(providedState?: SerializedClientState) {
    const state = providedState || (await this.client.fetchState());
    if (typeof state === "string") {
      return console.error(state);
    }
    const clientState = deserializeClientState(state);
    await this.cb?.(clientState);
  }

  async act(cb: (state: ClientState, event?: ServerEvent) => Promise<void>) {
    this.cb = cb;
    await this.ensureInitialized();
  }

  /**
   * Start walking to position, step by step. Note that walking
   * is not instantaneous, you need to wait for the steps to
   * complete.
   */
  async walkTo(position: { x: number; y: number }) {
    console.log("walkTo (%d, %d)", position.x, position.y);
    await this.client.walkTo(position);
  }
}
