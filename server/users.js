import { randomUUID } from "node:crypto"
import { getDatabase } from "./db.js"

// Server-only primitives; future auth must authorize every access to user data.
export async function createUser(db = getDatabase()) {
  const result = await db.query(
    "INSERT INTO app_private.users (id) VALUES ($1) RETURNING id, created_at",
    [randomUUID()],
  )
  return { _id: result.rows[0].id, createdAt: result.rows[0].created_at }
}

export async function findUserById(id, db) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new TypeError("A valid user ID is required")
  db ??= getDatabase()
  const result = await db.query("SELECT id, created_at FROM app_private.users WHERE id = $1", [id])
  return result.rows.length ? { _id: result.rows[0].id, createdAt: result.rows[0].created_at } : null
}
