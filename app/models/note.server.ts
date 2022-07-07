import { Entity, Schema } from "redis-om";
import { redis } from "~/db.server";
import { User } from "./user.server";

export interface Note {
  entityId: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
export class Note extends Entity {}

const noteSchema = new Schema(Note, {
  title: { type: "string" },
  body: { type: "string" },
  createdAt: { type: "date" },
  updatedAt: { type: "date", sortable: true },
  userId: { type: "string" },
});

const noteRepository = redis.fetchRepository(noteSchema);

noteRepository.createIndex();

export function getNote(id: Note["entityId"]) {
  return noteRepository.fetch(id);
}

export function getNoteListItems({ userId }: { userId: string }) {
  return noteRepository
    .search()
    .where("userId")
    .equals(userId)
    .sortDesc("updatedAt")
    .returnAll();
}

export function createNote({
  body,
  title,
  userId,
}: Pick<Note, "body" | "title"> & {
  userId: User["entityId"];
}) {
  const now = Date.now();
  return noteRepository.createAndSave({
    title,
    body,
    userId,
    createdAt: now,
    updatedAt: now,
  });
}

export function deleteNote(id: Note["entityId"]) {
  return noteRepository.remove(id);
}
