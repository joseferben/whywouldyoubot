import type { SessionStorage } from "@remix-run/node";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { User } from "./core";
import type { UserService } from "./UserService";
import type { PlayerService } from "./PlayerService";

export class SessionService {
  sessionStorage: SessionStorage;

  constructor(
    readonly userService: UserService,
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

  getSession(request: Request) {
    const cookie = request.headers.get("Cookie");
    return this.sessionStorage.getSession(cookie);
  }

  async getUserId(request: Request): Promise<User["id"] | undefined> {
    const session = await this.getSession(request);
    const userId = session.get(this.userSessionKey);
    return userId;
  }

  async getUser(request: Request) {
    const userId = await this.getUserId(request);
    if (userId === undefined) return null;

    const user = await this.userService.findById(userId);
    if (user) return user;

    throw await this.logout(request);
  }

  async getPlayer(request: Request) {
    const userId = await this.getUserId(request);
    if (userId === undefined) return null;

    const player = this.playerService.findByUserId(userId);
    if (player) return player;

    throw await this.logout(request);
  }

  async requireUserId(
    request: Request,
    redirectTo: string = new URL(request.url).pathname
  ) {
    const userId = await this.getUserId(request);
    if (!userId) {
      const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
      throw redirect(`/login?${searchParams}`);
    }
    return userId;
  }

  async requirePlayer(request: Request) {
    const userId = await this.requireUserId(request);
    const player = this.userService.findByUserId(userId);
    if (player) return player;

    throw await this.logout(request);
  }

  async requireUser(request: Request) {
    const userId = await this.requireUserId(request);

    const user = this.userService.findById(userId);
    if (user) return user;

    throw await this.logout(request);
  }

  async createUserSession({
    request,
    userId,
    remember,
    redirectTo,
  }: {
    request: Request;
    userId: string;
    remember: boolean;
    redirectTo: string;
  }) {
    const session = await this.getSession(request);
    session.set(this.userSessionKey, userId);
    return redirect(redirectTo, {
      headers: {
        "Set-Cookie": await this.sessionStorage.commitSession(session, {
          maxAge: remember
            ? 60 * 60 * 24 * 7 // 7 days
            : undefined,
        }),
      },
    });
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
