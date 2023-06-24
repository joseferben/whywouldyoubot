import type { Player, Item, Npc, EquipSlot } from "~/pure/engine/core";
import type { Rectangle } from "~/pure/engine/math";
import type { UserService } from "./UserService";
import { playerType, type GameDB } from "./GameDB";
import type { MapService } from "./MapService";
import type { OnlineService } from "./OnlineService";

export class PlayerService {
  constructor(
    readonly db: GameDB,
    readonly userService: UserService,
    readonly mapService: MapService,
    readonly onlineService: OnlineService,
    private spawn: { x: number; y: number }
  ) {}

  canReach(player: Player, x: number, y: number): boolean {
    return (
      player.posX >= x - 1 &&
      player.posX <= x + 1 &&
      player.posY >= y - 1 &&
      player.posY <= y + 1 &&
      !(player.posX === x && player.posY === y)
    );
  }

  hasEquipped(player: Player, item: Item): boolean {
    return (
      player.rightHand === item.id ||
      player.leftHand === item.id ||
      player.neck === item.id
    );
  }

  /** Return true if player died due to damage. */
  dealDamage(npc: Npc, player: Player, damage: number): boolean {
    if (damage === 0) {
      //   this.messageService.postEventField(
      //     `${npc.kind} misses.`,
      //     player.posX,
      //     player.posY
      //   );
      return false;
    }
    // this.messageService.postEventField(
    //   `${npc.kind} deals ${damage} damage.`,
    //   player.posX,
    //   player.posY
    // );
    if (player.currentHealth <= damage) {
      this.died(player);
      return true;
    } else {
      player.currentHealth -= damage;
      this.db.update(player);

      return false;
    }
  }

  gainXp(player: Player, xp: number) {
    player.xp += xp;
    this.db.update(player);
    // this.messageService.postEventField(
    //   `${player.username} gains ${xp} XP.`,
    //   player.posX,
    //   player.posY
    // );
  }

  died(player: Player) {
    player.posX = this.spawn.x;
    player.posY = this.spawn.y;
    player.currentHealth = player.health;
    this.db.update(player);
    // this.messageService.postEventGlobal(
    //   `${player.username} just died and was reborn.`
    // );
  }

  equip(player: Player, item: Item, equipSlot: EquipSlot) {
    if (equipSlot === "attack") {
      player.rightHand = item.id;
    } else if (equipSlot === "defense") {
      player.leftHand = item.id;
    } else if (equipSlot === "intelligence") {
      player.neck = item.id;
    }
    this.db.update(player);
  }

  unequip(player: Player, item: Item) {
    if (player.rightHand === item.id) {
      player.rightHand = null;
      this.db.update(player);
    } else if (player.leftHand === item.id) {
      player.leftHand = null;
      this.db.update(player);
    } else if (player.neck === item.id) {
      player.neck = null;
      this.db.update(player);
    }
  }

  combatLevel(player: Player): number {
    return player.attack + player.health + player.defense + player.intelligence;
  }

  findByName(name: string) {
    return this.db.findPlayerByUserUsername(name);
  }

  findByEmail(email: string) {
    return this.db.findPlayerByUserEmail(email);
  }

  findByUserId(userId: string) {
    return this.db.findPlayerByUserId(userId);
  }

  findInRectangleAndOnline(rec: Rectangle) {
    const { x, y, width, height } = rec;
    const xMin = x;
    const xMax = x + width;
    const yMin = y;
    const yMax = y + height;
    const players = this.db.findByRectangle(playerType, xMin, yMin, xMax, yMax);
    return players.filter(
      (player) => this.onlineService.onlinePlayers()[player.id] != null
    );
  }

  create(name: string, password?: string, emailOr?: string): Player {
    const user = this.userService.create(name, password, emailOr);
    const tocreate = {
      userId: user.id,
      username: user.username,
      posX: this.spawn.x,
      posY: this.spawn.y,
      currentHealth: 10,
      xp: 0,
      health: 10,
      intelligence: 1,
      defense: 1,
      attack: 1,
      hunting: 1,
      trading: 1,
      cooking: 1,
      farming: 1,
      fishing: 1,
      rightHand: null,
      leftHand: null,
      neck: null,
      head: null,
      torso: null,
      legs: null,
      feet: null,
      avatarHead: 0,
      avatarEyes: 0,
      avatarHair: 0,
    };
    const player = this.db.create(playerType, tocreate);
    this.onlineService.ensureOnline(player);
    // this.messageService.postEventGlobal(
    //   `${player.username} was just born into this world`,
    //   true
    // );
    return player;
  }

  deleteByEmail(email: string) {
    const user = this.findByEmail(email);
    if (user) {
      this.db.delete(user.id);
    }
  }
}
