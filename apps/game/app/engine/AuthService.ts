import { Authenticator } from "remix-auth";
import type { DiscordProfile, PartialDiscordGuild } from "remix-auth-discord";
import { DiscordStrategy } from "remix-auth-discord";
import type { SessionService } from "./SessionService";
import type { Player } from "@wwyb/core";
import type { PlayerService } from "./PlayerService";
import type { BotService } from "./BotService";
import { redirect } from "@remix-run/node";

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

export interface VerifyOptions {
  apiKey: string;
}

// class ApiTokenStrategy extends Strategy<Player, VerifyOptions> {
//   name = "api-token";
//   async authenticate(request: Request): Promise<Player> {
//     console.log("authenticating api token");
//     const apiKey = request.headers.get("X-API-Key");
//     if (!apiKey) {
//       throw new Error("API key is missing");
//     }
//     return this.verify({ apiKey });
//   }
// }

// Supports Discord and API key authentication.
export class AuthService {
  readonly discord: Authenticator<DiscordUser>;
  constructor(
    readonly sessionService: SessionService,
    readonly playerService: PlayerService,
    readonly botService: BotService,
    readonly discordClientId: string,
    readonly discordClientSecret: string,
    readonly discordCallbackUrl: string
  ) {
    this.discord = new Authenticator<DiscordUser>(
      sessionService.sessionStorage
    );
    const discordStrategy = new DiscordStrategy(
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
    this.discord.use(discordStrategy);
  }

  /**
   * Make sure the request is authenticated, either by a human player using Discord
   * or a bot using an API key.
   */
  async ensurePlayer(request: Request): Promise<Player> {
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey) {
      const bot = this.botService.db.findOneBy("apiKey", apiKey);
      if (!bot) throw redirect("Invalid API key");
      const player = this.playerService.db.findById(bot.ownerId);
      if (!player) throw new Error("Invalid API key");
      return player;
    } else {
      const discordUser = await this.discord.isAuthenticated(request, {
        failureRedirect: "/login",
      });
      const player = this.playerService.findByUserId(discordUser.id);
      if (!player) {
        return this.playerService.create(
          discordUser.id,
          discordUser.displayName
        );
      }
      return player;
    }
  }
}
