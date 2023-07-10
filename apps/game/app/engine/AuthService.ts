import { Authenticator } from "remix-auth";
import type { DiscordProfile, PartialDiscordGuild } from "remix-auth-discord";
import { DiscordStrategy } from "remix-auth-discord";
import type { SessionService } from "./SessionService";
import type { Player } from "@wwyb/core";
import type { PlayerService } from "./PlayerService";

export interface DiscordUser {
  id: DiscordProfile["id"];
  displayName: DiscordProfile["displayName"];
  avatar: DiscordProfile["__json"]["avatar"];
  discriminator: DiscordProfile["__json"]["discriminator"];
  email: DiscordProfile["__json"]["email"];
  guilds?: Array<PartialDiscordGuild>;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  readonly auth: Authenticator<DiscordUser>;
  readonly discordStrategy: DiscordStrategy<DiscordUser>;
  constructor(
    readonly sessionService: SessionService,
    readonly playerService: PlayerService,
    readonly discordClientId: string,
    readonly discordClientSecret: string,
    readonly discordCallbackUrl: string
  ) {
    this.auth = new Authenticator<DiscordUser>(sessionService.sessionStorage);

    this.discordStrategy = new DiscordStrategy(
      {
        clientID: this.discordClientId,
        clientSecret: this.discordClientSecret,
        callbackURL: this.discordCallbackUrl,
        // Provide all the scopes you want as an array
        scope: ["identify", "email"],
      },
      async ({
        accessToken,
        refreshToken,
        extraParams,
        profile,
      }): Promise<DiscordUser> => {
        /**
         * Construct the user profile to your liking by adding data you fetched etc.
         * and only returning the data that you actually need for your application.
         */
        return {
          id: profile.id,
          displayName: profile.__json.username,
          avatar: profile.__json.avatar,
          discriminator: profile.__json.discriminator,
          email: profile.__json.email,
          accessToken,
          guilds: [],
          refreshToken,
        };
      }
    );
    this.auth.use(this.discordStrategy);
  }

  async authenticate(request: Request): Promise<DiscordUser> {
    return this.auth.authenticate("discord", request);
  }

  async ensurePlayer(request: Request): Promise<Player> {
    const user = await this.auth.isAuthenticated(request, {
      failureRedirect: "/",
    });
    const player = this.playerService.findByUserId(user.id);
    if (!player) {
      return this.playerService.create(user.id, user.displayName);
    }
    return player;
  }
}
