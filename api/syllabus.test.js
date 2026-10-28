import test from "node:test"
import assert from "node:assert/strict"
import { handleSyllabus } from "./syllabus.js"

const validPdf = "%PDF-1.7\nexample"
const request = (body = validPdf, headers = { "Content-Type": "application/pdf", Origin: "https://novum.test" }) => new Request("https://novum.test/api/syllabus", { method: "POST", headers, body })
const data = { modules: [{ title: "Unit 1", topics: ["Cells", "Mitosis"] }] }
const upstream = (result = data, finishReason = "STOP") => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(result) }] } }] }) })

test("forwards the PDF with the server key and returns the checklist, never the key", async () => {
  let options
  const response = await handleSyllabus(request(), { key: "server-secret", reserve: async () => true, fetcher: async (url, init) => { options = init; assert.match(url, /generateContent$/); return upstream() } })
  assert.equal(response.status, 200)
  assert.equal(options.headers["x-goog-api-key"], "server-secret")
  assert.equal(Buffer.from(JSON.parse(options.body).contents[0].parts[1].inlineData.data, "base64").toString(), validPdf)
  const text = await response.text()
  assert.ok(!text.includes("server-secret"))
  assert.deepEqual(JSON.parse(text).modules[0].topics, [{ text: "Cells", done: false }, { text: "Mitosis", done: false }])
})

test("rejects foreign origins, invalid files and missing server key", async () => {
  assert.equal((await handleSyllabus(request(validPdf, { "Content-Type": "application/pdf", Origin: "https://evil.test" }), { key: "key" })).status, 403)
  assert.equal((await handleSyllabus(request("not-pdf"), { key: "key" })).status, 400)
  assert.equal((await handleSyllabus(request(), { key: "" })).status, 503)
  assert.equal((await handleSyllabus(request("%PDF-" + "x".repeat(3 * 1024 * 1024)), { key: "key" })).status, 413)
})

test("fails closed on exhausted or unavailable quota and incomplete model output", async () => {
  const never = async () => { throw new Error("unexpected request") }
  assert.equal((await handleSyllabus(request(), { key: "key", reserve: async () => false, fetcher: never })).status, 429)
  assert.equal((await handleSyllabus(request(), { key: "key", reserve: async () => { throw new Error("database unavailable") }, fetcher: never })).status, 503)
  assert.equal((await handleSyllabus(request(), { key: "key", reserve: async () => true, fetcher: async () => upstream(data, "MAX_TOKENS") })).status, 502)
  assert.equal((await handleSyllabus(request(), { key: "key", reserve: async () => true, fetcher: async () => upstream({ modules: [] }) })).status, 422)
})
