import type { Bot } from "@wwyb/core";

async function respToJson<T = void>(resp: Response): Promise<T> {
  if (resp.status === 200 || resp.status === 400) {
    return resp.json();
  }
  const error = await resp.text();
  throw new Error("request failed " + error);
}

class Client {
  async createBot(name: string): Promise<Bot | string> {
    return respToJson<Bot>(
      await fetch("/api/bots/create/", {
        method: "post",
        body: JSON.stringify({ name: name }),
      })
    );
  }

  async deleteBot(id: string): Promise<void> {
    await fetch("/api/bots/delete/", {
      method: "post",
      body: JSON.stringify({ id: id }),
    });
  }

  async walkTo(x: number, y: number): Promise<void | string> {
    return respToJson(
      await fetch("/api/walk/", {
        method: "post",
        body: JSON.stringify({ x: x, y: y }),
      })
    );
  }
}

export const client = new Client();
