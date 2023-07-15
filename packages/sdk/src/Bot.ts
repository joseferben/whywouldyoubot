import { Client } from "./Client";
import type { ClientState } from "@wwyb/core";

export type Opts = {
  apiKey: string;
};

export class Bot {
  initialized: boolean;
  client: Client;
  cb: ((state: ClientState) => Promise<void>) | undefined;

  constructor(client: Client | { baseUrl: string; apiKey: string }) {
    if (client instanceof Client) {
      this.client = client;
    } else {
      this.client = new Client({
        apiKey: client.apiKey,
        baseUrl: client.baseUrl,
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

  private async _tick() {
    console.log("_tick", this.client.opts?.apiKey);
    const state = await this.client.fetchState();
    await this.cb?.(state);
  }

  async onTick(cb: (state: ClientState) => Promise<void>) {
    this.cb = cb;
    await this.ensureInitialized();
  }
}
