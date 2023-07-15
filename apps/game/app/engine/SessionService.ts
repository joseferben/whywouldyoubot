import type { SessionStorage } from "@remix-run/node";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { PlayerService } from "./PlayerService";

export class SessionService {
  sessionStorage: SessionStorage;

  constructor(
    readonly playerService: PlayerService,
    readonly sessionSecret: string,
    readonly userSessionKey: string
  ) {
    this.sessionStorage = createCookieSessionStorage({
      cookie: {
        name: "__session",
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secrets: [sessionSecret],
        secure: process.env.NODE_ENV === "production",
      },
    });
  }

  async getSession(request: Request) {
    const cookie = request.headers.get("Cookie");
    return this.sessionStorage.getSession(cookie);
  }

  async logout(request: Request) {
    const session = await this.getSession(request);
    return redirect("/", {
      headers: {
        "Set-Cookie": await this.sessionStorage.destroySession(session),
      },
    });
  }
}
