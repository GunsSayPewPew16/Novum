import test from "node:test"
import assert from "node:assert/strict"
import { loadSubjects, saveSubjects, toggleTopic } from "./subjects.js"

test("persists checklist progress and leaves other subjects unchanged", () => {
  const values = new Map()
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
  const subjects = [
    { id: "one", name: "Biology", modules: [{ title: "Cells", topics: [{ text: "Mitosis", done: false }, { text: "Meiosis", done: false }] }] },
    { id: "two", name: "Physics", modules: [{ title: "Motion", topics: [{ text: "Velocity", done: false }] }] },
  ]
  const updated = toggleTopic(subjects, "one", 0, 1)
  saveSubjects(updated, storage)
  assert.deepEqual(loadSubjects(storage), updated)
  assert.equal(loadSubjects(storage)[0].modules[0].topics[1].done, true)
  assert.equal(subjects[0].modules[0].topics[1].done, false)
  assert.deepEqual(updated[1], subjects[1])
  assert.equal(toggleTopic(updated, "one", 0, 1)[0].modules[0].topics[1].done, false)
})

test("falls back to an empty list for corrupt storage and reports save failures", () => {
  assert.deepEqual(loadSubjects({ getItem: () => "invalid JSON" }), [])
  assert.throws(() => saveSubjects([], { setItem: () => { throw new Error("full") } }), /full/)
})
