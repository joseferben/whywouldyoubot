import type { Player, Item, Npc, EquipSlot } from "~/engine/core";
import type { Rectangle } from "~/engine/math";
import type { UserService } from "./UserService";
import type { WorldMapService } from "./WorldMapService";
import type { OnlineService } from "./OnlineService";
import type { JSONStore } from "./EntityDB/JSONStore";
import { EntityDB } from "./EntityDB/EntityDB";

export class PlayerService {
  db!: EntityDB<Player>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly userService: UserService,
    readonly mapService: WorldMapService,
    readonly onlineService: OnlineService,
    private spawn: { x: number; y: number }
  ) {
    this.db = EntityDB.builder<Player>()
      .withSpatialIndex()
      .withFieldIndex(["username", "userId"])
      .withPersistor(jsonStore, "pla")
      .build();
  }

  canReach(player: Player, x: number, y: number): boolean {
    return !(player.x === x && player.y === y);
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
      //     player.x,
      //     player.y
      //   );
      return false;
    }
    // this.messageService.postEventField(
    //   `${npc.kind} deals ${damage} damage.`,
    //   player.x,
    //   player.y
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
    //   player.x,
    //   player.y
    // );
  }

  died(player: Player) {
    player.x = this.spawn.x;
    player.y = this.spawn.y;
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

  findAll() {
    return this.db.findAll();
  }

  findByName(name: string) {
    return this.db.findOneBy("username", name);
  }

  findByEmail(email: string) {
    const user = this.userService.findByEmail(email);
    if (!user) return null;
    return this.db.findOneBy("userId", user.id);
  }

  findByUserId(userId: string) {
    const user = this.userService.findById(userId);
    if (!user) return null;
    return this.db.findOneBy("userId", user.id);
  }

  findInRectangleAndOnline(rec: Rectangle) {
    const { x, y, width, height } = rec;
    const xMin = x;
    const xMax = x + width;
    const yMin = y;
    const yMax = y + height;
    const players = this.db.findByRectangle(xMin, yMin, xMax, yMax);
    return players.filter(
      (player) => this.onlineService.onlinePlayers()[player.id] != null
    );
  }

  create(name: string, password?: string, emailOr?: string): Player {
    const user = this.userService.create(name, password, emailOr);
    const tocreate = {
      userId: user.id,
      username: user.username,
      x: this.spawn.x,
      y: this.spawn.y,
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
    const player = this.db.create(tocreate);
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
      this.db.delete(user);
    }
  }
}
