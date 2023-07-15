import { Client } from "./Client";
import type { ClientState, ServerEvent } from "@wwyb/core";

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
    const state = await this.client.fetchState();
    const clientState = {
      me: state.me,
      actions: state.actions || [],
      ground: state.ground || [],
      npcs: state.npcs || [],
      inventory: state.inventory || [],
      droppedItems: state.droppedItems || [],
      players: new Map(state.players.map((p) => [p.id, p])),
    };
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
    await this.client.walkTo(position);
  }
}
