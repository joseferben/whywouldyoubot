import bcrypt from "bcryptjs";
import { Entity, Schema } from "redis-om";
import { redis } from "~/db.server";
import { map } from "~/map.server";
import { Rectangle } from "~/utils";

const SPAWN_X = 560;
const SPAWN_Y = 580;

export interface User {
  entityId: string;
  name: string;
  password: string;
  email?: string;
  posX: number;
  posY: number;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  canSee(x: number, y: number): boolean {
    return (
      this.posX >= x - 1 &&
      this.posX <= x + 1 &&
      this.posY >= y - 1 &&
      this.posY <= y + 1 &&
      !(this.posX === x && this.posY === y)
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
    this.posX = x;
    this.posY = y;
  }
}

const userSchema = new Schema(User, {
  name: { type: "string", indexed: true },
  email: { type: "string", indexed: true },
  password: { type: "string" },
  posX: { type: "number", indexed: true },
  posY: { type: "number", indexed: true },
  createdAt: { type: "date" },
  updatedAt: { type: "date" },
});

export const userRepository = redis.fetchRepository(userSchema);

export async function updateUser(user: User) {
  userRepository.save(user);
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
    .where("posX")
    .greaterThanOrEqualTo(xMin)
    .where("posX")
    .lessThanOrEqualTo(xMax)
    .where("posY")
    .greaterThanOrEqualTo(yMin)
    .where("posY")
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

export async function createUser(
  name: string,
  password: string,
  emailOr?: string
) {
  const now = Date.now();
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = emailOr || null;
  return userRepository.createAndSave({
    name,
    password: hashedPassword,
    email,
    posX: SPAWN_X,
    posY: SPAWN_Y,
    createdAt: now,
    updatedAt: now,
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
