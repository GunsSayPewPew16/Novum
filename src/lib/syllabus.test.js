import test from "node:test"
import assert from "node:assert/strict"
import { analyzeSyllabus, MAX_PDF_BYTES } from "./syllabus.js"

const pdf = { name: "syllabus.pdf", size: 12, arrayBuffer: async () => new TextEncoder().encode("%PDF-1.7\nend").buffer }

test("sends the PDF to the same-origin backend without a credential", async () => {
  let sent
  const modules = [{ title: "Unit 1", topics: [{ text: "Cells", done: false }] }]
  const result = await analyzeSyllabus(pdf, async (url, options) => { sent = { url, options }; return { ok: true, json: async () => ({ modules }) } })
  assert.equal(sent.url, "/api/syllabus")
  assert.deepEqual(sent.options.headers, { "Content-Type": "application/pdf" })
  assert.equal(new TextDecoder().decode(sent.options.body), "%PDF-1.7\nend")
  assert.deepEqual(result, modules)
})

test("rejects invalid or oversized files before making a request", async () => {
  const never = () => { throw new Error("unexpected request") }
  await assert.rejects(analyzeSyllabus({ ...pdf, size: MAX_PDF_BYTES + 1 }, never), /no larger than 3 MB/)
  await assert.rejects(analyzeSyllabus({ ...pdf, arrayBuffer: async () => new TextEncoder().encode("not a PDF").buffer }, never), /not a valid PDF/)
})

test("reports backend errors and invalid responses", async () => {
  await assert.rejects(analyzeSyllabus(pdf, async () => ({ ok: false, json: async () => ({ error: "Daily limit reached" }) })), /Daily limit reached/)
  await assert.rejects(analyzeSyllabus(pdf, async () => ({ ok: true, json: async () => ({}) })), /invalid response/)
})
