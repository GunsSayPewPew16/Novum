import test from "node:test"
import assert from "node:assert/strict"
import { createUser, findUserById } from "./users.js"

test("creates and retrieves unique user records with parameterized queries", async () => {
  const records = new Map()
  const db = { query: async (sql, values) => {
    assert.equal(values.length, 1)
    if (sql.startsWith("INSERT")) {
      const record = { id: values[0], created_at: new Date() }
      records.set(record.id, record)
      return { rows: [record] }
    }
    assert.match(sql, /^SELECT/)
    return { rows: records.has(values[0]) ? [records.get(values[0])] : [] }
  } }
  const first = await createUser(db)
  const second = await createUser(db)
  assert.notEqual(first._id, second._id)
  assert.ok(first.createdAt instanceof Date)
  assert.deepEqual(await findUserById(first._id, db), first)
  assert.equal(await findUserById("00000000-0000-4000-8000-000000000000", db), null)
  await assert.rejects(findUserById("", db), /user ID/i)
})
