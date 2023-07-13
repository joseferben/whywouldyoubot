import type { Player } from "@wwyb/core";
import type { PlayerService } from "./PlayerService";
import fs from "fs";
import path from "path";

export class CharacterCustomizationService {
  constructor(readonly playserService: PlayerService) {}

  findCustomization(player: Player): {
    head: number;
    eyes: number;
    hair: number;
  } {
    return { head: 1, eyes: 1, hair: 1 };
  }

  setCustomization(
    player: Player,
    customization: { head: number; eyes: number; hair: number }
  ) {
    player.avatarHead = customization.head;
    player.avatarEyes = customization.eyes;
    player.avatarHair = customization.hair;
    this.playserService.db.update(player);
  }

  private async findImages(regex: RegExp): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const dir = path.join(process.cwd(), "./public/assets/avatars");

      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        const numbers: number[] = [];

        files.forEach((file) => {
          const match = file.match(regex);
          if (match) {
            numbers.push(Number(match[1]));
          }
        });

        resolve(numbers);
      });
    });
  }

  findHeads(): Promise<number[]> {
    return this.findImages(/^head_(\d+)\.png$/);
  }

  findEyes(): Promise<number[]> {
    return this.findImages(/^eyes_(\d+)\.png$/);
  }

  findHair(): Promise<number[]> {
    return this.findImages(/^hair_(\d+)\.png$/);
  }
}
