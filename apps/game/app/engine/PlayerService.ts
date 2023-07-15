import type { Player, Item, Npc, EquipSlot } from "@wwyb/core";
import type { WorldMapService } from "./WorldMapService";
import type { OnlineService } from "./OnlineService";
import { initOnce } from "~/utils";
import type { JSONStore } from "@wwyb/entitydb";
import { EntityDB } from "@wwyb/entitydb";

export class PlayerService {
  db!: EntityDB<Player>;
  constructor(
    readonly jsonStore: JSONStore,
    readonly mapService: WorldMapService,
    readonly onlineService: OnlineService,
    readonly playerVisibility: number,
    private spawn: { x: number; y: number }
  ) {
    [this.db] = initOnce(
      this.constructor.name,
      () =>
        new EntityDB<Player>({
          spatial: true,
          fields: ["username", "userId"],
          jsonStore,
          persistenceNamespace: "pla",
        })
    );
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

  findByUserId(userId: string) {
    return this.db.findOneBy("userId", userId);
  }

  findInRectangleAndOnline(x1: number, y1: number, x2: number, y2: number) {
    const players = this.db.findByRectangle(x1, y1, x2, y2);
    return players.filter((player) => this.onlineService.isOnline(player));
  }

  create(username: string, userId?: string): Player | string {
    if (this.db.findBy("username", username).length > 0)
      return "Name already taken";
    const tocreate = {
      // if userId is null, it's a bot
      userId: userId ?? null,
      username: username,
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
      avatarHead: null,
      avatarEyes: null,
      avatarHair: null,
    };
    const player = this.db.create(tocreate);
    this.onlineService.ensureOnline(player);
    return player;
  }

  findAroundPlayer(player: Player) {
    return this.findInRectangleAndOnline(
      player.x - this.playerVisibility,
      player.y - this.playerVisibility,
      player.x + this.playerVisibility,
      player.y + this.playerVisibility
    );
  }
}
