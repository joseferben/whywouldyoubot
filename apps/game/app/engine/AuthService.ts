import { Authenticator } from "remix-auth";
import type { DiscordProfile, PartialDiscordGuild } from "remix-auth-discord";
import { DiscordStrategy } from "remix-auth-discord";
import type { SessionService } from "./SessionService";
import type { Player } from "@wwyb/core";
import type { PlayerService } from "./PlayerService";
import type { BotService } from "./BotService";
import { Profiler } from "./Profiler";

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

// Supports Discord authentication.
export class AuthService extends Profiler {
  readonly discord: Authenticator<DiscordUser>;
  constructor(
    readonly sessionService: SessionService,
    readonly playerService: PlayerService,
    readonly botService: BotService,
    readonly discordClientId: string,
    readonly discordClientSecret: string,
    readonly discordCallbackUrl: string
  ) {
    super();
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
      if (!bot) throw new Response("Invalid API key", { status: 401 });
      const player = this.playerService.db.findById(bot.playerId);
      if (!player) throw new Response("Invalid API key", { status: 401 });
      if (player.userId !== null)
        throw new Error("Bot player should not have a user ID");
      return player;
    } else {
      const discordUser = await this.discord.isAuthenticated(request, {
        failureRedirect: "/login",
      });
      const player = this.playerService.findByUserId(discordUser.id);
      if (!player) {
        const created = this.playerService.create(
          discordUser.displayName,
          discordUser.id
        );
        if (typeof created === "string") throw new Error(created);
        return created;
      }
      return player;
    }
  }
}
