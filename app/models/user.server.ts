import bcrypt from "bcryptjs";
import { Entity, Schema } from "redis-om";
import { redis } from "~/db.server";

export interface User {
  entityId: string;
  name: string;
  password: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {}

const userSchema = new Schema(User, {
  name: { type: "string", indexed: true },
  email: { type: "string", indexed: true },
  password: { type: "string" },
  createdAt: { type: "date" },
  updatedAt: { type: "date" },
});

const userRepository = redis.fetchRepository(userSchema);

userRepository.createIndex();

export async function getUserById(id: User["entityId"]) {
  return userRepository.fetch(id);
}

export async function getUserByName(name: User["name"]) {
  return userRepository.search().where("name").is.equalTo(name).return.first();
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
