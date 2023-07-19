import { responseToJson } from "@wwyb/core";
import type {
  Bot,
  Emoji,
  PotentialAction,
  PotentialActionMap,
  SerializedClientState,
} from "@wwyb/core";

export type Opts = {
  apiKey?: string;
  baseUrl?: string;
};

export class Client {
  constructor(readonly opts?: Opts) {}

  private withHeaders(headers = {}) {
    return this.opts?.apiKey
      ? { ...headers, "x-api-key": this.opts?.apiKey }
      : { ...headers };
  }

  protected async fetch(
    path: string,
    opts?: {
      method?: string;
      body?: string;
      headers?: { [key: string]: string };
    }
  ): Promise<Response> {
    return fetch(`${this?.opts?.baseUrl || ""}${path}`, {
      headers: this.withHeaders(opts?.headers),
      method: opts?.method,
      body: opts?.body,
    });
  }

  async fetchState(): Promise<SerializedClientState | string> {
    return responseToJson<SerializedClientState>(
      await this.fetch("/api/state/", {
        headers: this.withHeaders(),
        method: "get",
      })
    );
  }

  async createBot(name: string): Promise<Bot | string> {
    return responseToJson<Bot>(
      await this.fetch("/api/bots/create/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ name: name }),
      })
    );
  }

  async deleteBot(id: string): Promise<null | string> {
    return responseToJson<null>(
      await this.fetch("/api/bots/delete/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ id: id }),
      })
    );
  }

  async walkTo(position: { x: number; y: number }): Promise<null | string> {
    return responseToJson<null>(
      await this.fetch("/api/walk/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ x: position.x, y: position.y }),
      })
    );
  }

  async showEmoji(emoji: Emoji): Promise<null | string> {
    return responseToJson<null>(
      await this.fetch("/api/emoji/show/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ emoji: emoji }),
      })
    );
  }

  async fetchPotentialActionMap(position: {
    x: number;
    y: number;
  }): Promise<PotentialActionMap | string> {
    return responseToJson<PotentialActionMap>(
      await this.fetch("/api/potential-actions/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ x: position.x, y: position.y }),
      })
    );
  }

  async executePotentialAction(a: PotentialAction): Promise<null | string> {
    return responseToJson<null>(
      await this.fetch("/api/execute-potential-actions/", {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify(a),
      })
    );
  }
}

export const client = new Client();
