import type { User } from "~/engine/core";
import type { GameDB } from "./GameDB";
import bcrypt from "bcrypt";
import invariant from "tiny-invariant";
import type { JSONStore } from "./EntityDB/JSONStore";
import { EntityDB } from "./EntityDB/EntityDB";

export class UserService {
  db!: EntityDB<User>;

  constructor(readonly jsonStore: JSONStore) {
    this.db = EntityDB.builder<User>()
      .withFieldIndex(["username", "email"])
      .withPersistor(jsonStore, "users")
      .build();
  }

  findByUsername(name: string) {
    return this.db.findOneBy("username", name);
  }

  findByEmail(email: string) {
    return this.db.findOneBy("email", email);
  }

  findById(id: string) {
    return this.db.findById(id);
  }

  create(name: string, password?: string, emailOr?: string) {
    const now = Date.now();
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;
    const email = emailOr || null;
    const user = {
      username: name,
      password: hashedPassword,
      email,
      joinedAt: now,
    };
    return this.db.create(user);
  }

  deleteByEmail(email: string) {
    const user = this.findByEmail(email);
    if (user) {
      this.db.delete(user);
    }
  }

  isValidPassword(user: User, password: string): boolean {
    const hashedPassword = user.password;
    invariant(hashedPassword, "hashed password not found");
    return bcrypt.compareSync(password, hashedPassword);
  }

  verifyLogin(name: string, password: string): User | null {
    const user = this.findByUsername(name);

    if (!user || !user.password) {
      return null;
    }

    const isValid = this.isValidPassword(user, password);

    if (!isValid) {
      return null;
    }

    return user;
  }

  updatePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ) {
    invariant(
      newPassword === newPasswordConfirmation,
      "can not update password that do not match"
    );
    invariant(user.password, "can not update password if password was not set");
    invariant(
      bcrypt.compareSync(currentPassword, user.password),
      "current password does not match"
    );
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    this.db.update(user);
  }

  setPassword(user: User, password: string, passwordConfirmation: string) {
    invariant(!user.password, "can not set password if already set");
    invariant(
      password === passwordConfirmation,
      "can not set password with non matching confirmation"
    );
    const hashedPassword = bcrypt.hashSync(password, 10);
    user.password = hashedPassword;
    this.db.update(user);
  }
}
