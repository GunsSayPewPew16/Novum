import test from "node:test"
import assert from "node:assert/strict"
import { analyzeSyllabus, MAX_PDF_BYTES } from "./syllabus.js"

const pdf = { name: "syllabus.pdf", size: 12, arrayBuffer: async () => new TextEncoder().encode("%PDF-1.7\nend").buffer }
const payload = (data, finishReason = "STOP") => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }] }) })

test("sends the PDF to Gemini and builds a checklist in module order", async () => {
  let sent
  const modules = await analyzeSyllabus(pdf, "test-key", async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) }
    return payload({ modules: [{ title: "Unit 1", topics: ["Cells", "Mitosis"] }, { title: "Unit 2", topics: ["Genetics"] }] })
  })
  assert.match(sent.url, /gemini-3\.8-flash:generateContent$/)
  assert.equal(sent.options.headers["x-goog-api-key"], "test-key")
  assert.equal(sent.body.contents[0].parts[1].inlineData.mimeType, "application/pdf")
  assert.equal(atob(sent.body.contents[0].parts[1].inlineData.data), "%PDF-1.7\nend")
  assert.deepEqual(modules, [{ title: "Unit 1", topics: [{ text: "Cells", done: false }, { text: "Mitosis", done: false }] }, { title: "Unit 2", topics: [{ text: "Genetics", done: false }] }])
})

test("rejects invalid or oversized files before contacting Gemini", async () => {
  const never = () => { throw new Error("unexpected request") }
  await assert.rejects(analyzeSyllabus({ ...pdf, size: MAX_PDF_BYTES + 1 }, "key", never), /no larger than 3 MB/)
  await assert.rejects(analyzeSyllabus({ ...pdf, arrayBuffer: async () => new TextEncoder().encode("not a PDF").buffer }, "key", never), /not a valid PDF/)
})

test("reports rate limiting and incomplete or empty output", async () => {
  await assert.rejects(analyzeSyllabus(pdf, "key", async () => ({ ok: false, status: 429 })), /free-tier limit/)
  await assert.rejects(analyzeSyllabus(pdf, "key", async () => payload({ modules: [{ title: "Unit", topics: ["Topic"] }] }, "MAX_TOKENS")), /incomplete response/)
  await assert.rejects(analyzeSyllabus(pdf, "key", async () => payload({ modules: [] })), /No complete topic list/)
})
