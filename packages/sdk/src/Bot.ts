import { Client } from "./Client";
import type {
  ClientState,
  SerializedClientState,
  ServerEvent,
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
    const clientState = {
      me: state.me,
      actions: state.actions || [],
      ground: state.ground || [],
      npcs: state.npcs || [],
      inventory: state.inventory || [],
      droppedItems: state.droppedItems || [],
      players: state.players
        ? new Map(state.players.map((p) => [p.id, p]))
        : new Map(),
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
