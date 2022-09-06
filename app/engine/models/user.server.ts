import bcrypt from "bcryptjs";
import { Entity, Schema } from "redis-om";
import { db } from "~/engine/db.server";
import { map } from "~/engine/map.server";
import { Rectangle } from "~/utils";

const SPAWN_X = 560;
const SPAWN_Y = 580;

export interface User {
  entityId: string;
  name: string;
  password: string;
  email?: string;
  health: number;
  maxHealth: number;
  attack: number;
  intelligence: number;
  defense: number;
  x: number;
  y: number;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  HIT_DELAY_MS = 1000;
  canSee(x: number, y: number): boolean {
    return (
      this.x >= x - 1 &&
      this.x <= x + 1 &&
      this.y >= y - 1 &&
      this.y <= y + 1 &&
      !(this.x === x && this.y === y)
    );
  }

  canWalk(x: number, y: number) {
    const tile = map.tiles[x][y];
    return this.canSee(x, y) && !tile.obstacle;
  }

  walk(x: number, y: number) {
    if (!this.canWalk(x, y)) {
      console.warn(`user ${this.entityId} tried to walk to (${x}/${y})`);
    }
    this.x = x;
    this.y = y;
  }

  rollDamage() {
    return Math.round(Math.random() * 10);
  }

  dealDamage(damage: number) {
    this.health -= damage;
  }

  die() {
    // 1. drop some items
    // 2. change coords to respawn
    // 3. set health to max health
  }

  tickDelay() {
    return 500;
  }
}

const userSchema = new Schema(
  User,
  {
    name: { type: "string", indexed: true },
    email: { type: "string", indexed: true },
    password: { type: "string" },
    health: { type: "number" },
    maxHealth: { type: "number" },
    attack: { type: "number" },
    intelligence: { type: "number" },
    defense: { type: "number" },
    x: { type: "number", indexed: true },
    y: { type: "number", indexed: true },
    lastHitAt: { type: "date" },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
  },
  {
    dataStructure: "HASH",
  }
);

export const userRepository = db.fetchRepository(userSchema);

export async function updateUser(user: User) {
  userRepository.save(user);
}

export async function getUserOrThrow(id: User["entityId"]) {
  return userRepository.fetch(id);
}

export async function getUser(id: User["entityId"]) {
  return userRepository.fetch(id);
}

export async function getUserById(id: User["entityId"]) {
  const user = await userRepository.fetch(id);
  return user.name === null ? null : user;
}

export async function getUserByName(name: User["name"]) {
  return userRepository.search().where("name").is.equalTo(name).return.first();
}

export async function getUsersByRect(rec: Rectangle) {
  const { x, y, width, height } = rec;
  const xMin = x;
  const xMax = x + width;
  const yMin = y;
  const yMax = y + height;
  return userRepository
    .search()
    .where("x")
    .greaterThanOrEqualTo(xMin)
    .where("x")
    .lessThanOrEqualTo(xMax)
    .where("y")
    .greaterThanOrEqualTo(yMin)
    .where("y")
    .lessThanOrEqualTo(yMax)
    .return.all();
}

export async function getUserByEmail(email: string) {
  return userRepository
    .search()
    .where("email")
    .is.equalTo(email)
    .return.first();
}

export async function getUsersAt(x: number, y: number) {
  return userRepository
    .search()
    .where("x")
    .equal(x)
    .where("y")
    .equal(y)
    .returnAll();
}

export async function createUser(
  name: string,
  password: string,
  emailOr?: string
) {
  const now = new Date();
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = emailOr || null;
  return userRepository.createAndSave({
    name,
    password: hashedPassword,
    email,
    x: SPAWN_X,
    y: SPAWN_Y,
    createdAt: now,
    updatedAt: now,
    lastActAt: now,
  });
}

export async function deleteUserByEmail(email: string) {
  const user = await getUserByEmail(email);
  if (user) {
    userRepository.remove(user.entityId);
  }
}

export async function verifyLogin(name: string, hashedPassword: string) {
  const user = await getUserByName(name);

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(hashedPassword, user.password);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = user;

  return userWithoutPassword;
}
