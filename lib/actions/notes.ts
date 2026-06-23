"use server";

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// Full rows, most-recently-edited first. The note set is small (personal app),
// so loading everything once lets the client switch between notes with no extra
// round-trips; only mutations hit the API.
export async function getNotes() {
  return db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      updated_at: notes.updated_at,
    })
    .from(notes)
    .orderBy(desc(notes.updated_at));
}
