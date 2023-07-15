import type { Bot, SerializedClientState } from "@wwyb/core";

async function respToJson<T>(resp: Response): Promise<T> {
  // TODO unpack {error: null} or {error: "error messagr"}
  if (resp.status === 200 || resp.status === 400) {
    return resp.json();
  }
  throw new Error(
    `request failed with response ${resp.status} ${Array.from(
      resp.headers.values()
    )}}`
  );
}

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

  async fetchState(): Promise<SerializedClientState> {
    return respToJson<SerializedClientState>(
      await this.fetch(`${this?.opts?.baseUrl || ""}/api/state/`, {
        headers: this.withHeaders(),
        method: "get",
      })
    );
  }

  async createBot(name: string): Promise<Bot | string> {
    return respToJson<Bot>(
      await this.fetch(`${this?.opts?.baseUrl || ""}/api/bots/create/`, {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ name: name }),
      })
    );
  }

  async deleteBot(id: string): Promise<void> {
    await this.fetch(`${this?.opts?.baseUrl || ""}/api/bots/delete/`, {
      headers: this.withHeaders(),
      method: "post",
      body: JSON.stringify({ id: id }),
    });
  }

  async walkTo(position: { x: number; y: number }): Promise<null | string> {
    return respToJson(
      await this.fetch(`${this?.opts?.baseUrl || ""}/api/walk/`, {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ x: position.x, y: position.y }),
      })
    );
  }
}

export const client = new Client();
