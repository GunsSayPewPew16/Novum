import test from "node:test"
import assert from "node:assert/strict"
import { reserveAnalysis } from "./db.js"

test("reserves against a UTC day using one atomic conditional upsert", async () => {
  let called
  const db = { query: async (sql, args) => { called = { sql, args }; return { rowCount: 1 } } }
  assert.equal(await reserveAnalysis(new Date("2026-01-02T23:30:00-05:00"), db), true)
  assert.match(called.sql, /ON CONFLICT \(day\) DO UPDATE/)
  assert.match(called.sql, /WHERE counter\.count < \$2/)
  assert.equal(called.args[0], "2026-01-03")
  assert.ok(Number.isSafeInteger(called.args[1]) && called.args[1] > 0)
  assert.equal(await reserveAnalysis(new Date(), { query: async () => ({ rowCount: 0 }) }), false)
})

test("propagates database failures so the API can fail closed", async () => {
  await assert.rejects(reserveAnalysis(new Date(), { query: async () => { throw new Error("database offline") } }), /database offline/)
})
