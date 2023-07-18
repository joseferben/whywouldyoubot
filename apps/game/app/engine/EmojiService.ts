import type { Emoji, Player, ShownEmoji } from "@wwyb/core";
import { EntityDB } from "@wwyb/entitydb";
import fs from "fs";
import path from "path";
import { initOnce } from "~/utils";
import type { ServerEventService } from "./ServerEventService";
import type { PlayerService } from "./PlayerService";

export class EmojiService {
  readonly emojis: Emoji[] = [];
  readonly db!: EntityDB<ShownEmoji>;
  private emojisRoutePath: string;
  private emojisDirPath: string;

  constructor(
    readonly assetsDirPath: string,
    readonly assetsRoutePath: string,
    readonly emojiDuration: number,
    readonly serverEventService: ServerEventService,
    readonly playerService: PlayerService
  ) {
    this.emojisDirPath = `${assetsDirPath}/emojis`;
    this.emojisRoutePath = `${assetsRoutePath}/emojis`;
    this.loadEmojis();
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<ShownEmoji>({
          namespace: "emj",
          fields: ["playerId"],
          evictorListener: this.unshowEmoji.bind(this),
        })
    );
  }

  private loadEmojis(): void {
    const files = fs.readdirSync(this.emojisDirPath);
    for (const file of files) {
      const filePath = path.join(this.emojisRoutePath, file);
      if (file.endsWith(".png")) {
        const fileNameWithoutExt = path.parse(file).name;
        const emojiId = parseInt(fileNameWithoutExt);
        this.emojis.push({ id: emojiId, path: filePath });
      }
    }
  }

  private unshowEmoji(shownEmoji: ShownEmoji): void {
    const player = this.playerService.db.getById(shownEmoji.playerId);
    this.serverEventService.playerUnshownEmoji(
      player,
      this.findShownEmojisByPlayer(player)
    );
  }

  showEmoji(player: Player, emojiId: number) {
    console.debug(`player ${player.username} shows emoji ${emojiId}`);
    const found = this.db.findOneBy("playerId", player.id);
    const emoji = this.getEmojiByNumber(emojiId);
    if (!found) {
      this.db.create(
        {
          playerId: player.id,
          emoji,
        },
        { ttlMs: this.emojiDuration }
      );
    } else {
      // resetting the counter
      this.db.expire(found, this.emojiDuration);
    }
    this.serverEventService.playerShownEmoji(
      player,
      this.findShownEmojisByPlayer(player)
    );
  }

  getEmojiByNumber(emoji: number): Emoji {
    return { id: emoji, path: `${this.emojisRoutePath}/${emoji}.png` };
  }

  findShownEmojisByPlayer(player: Player): ShownEmoji[] {
    return this.db.findAll();
  }
}
