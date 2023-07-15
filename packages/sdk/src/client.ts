import type { Bot, ClientState } from "@wwyb/core";

async function respToJson<T = void>(resp: Response): Promise<T> {
  if (resp.status === 200 || resp.status === 400) {
    return resp.json();
  }
  const error = await resp.text();
  throw new Error(
    `request failed ${error} ${resp.status} ${JSON.stringify(resp.headers)}}`
  );
}

export type Opts = {
  apiKey: string;
  baseUrl: string;
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

  async fetchState(): Promise<ClientState> {
    return respToJson<ClientState>(
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

  async walkTo(x: number, y: number): Promise<void | string> {
    return respToJson(
      await this.fetch(`${this?.opts?.baseUrl || ""}/api/walk/`, {
        headers: this.withHeaders(),
        method: "post",
        body: JSON.stringify({ x: x, y: y }),
      })
    );
  }
}

export const client = new Client();
