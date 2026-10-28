import { createServer } from "node:http"
import { Readable } from "node:stream"
import { loadEnv } from "vite"
import { handleSyllabus } from "../api/syllabus.js"

Object.assign(process.env, { ...loadEnv("development", process.cwd(), ""), ...process.env })

createServer(async (req, res) => {
  try {
    if (req.url?.split("?")[0] !== "/api/syllabus") { res.writeHead(404).end(); return }
    // The Vite proxy preserves the public host and origin for same-origin validation.
    const url = new URL(req.url, `http://${req.headers.host}`)
    const init = { method: req.method, headers: req.headers }
    if (req.method !== "GET" && req.method !== "HEAD") { init.body = Readable.toWeb(req); init.duplex = "half" }
    const response = await handleSyllabus(new Request(url, init))
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Syllabus service unavailable." }))
  }
}).listen(3001, "127.0.0.1", () => console.log("Syllabus API listening on 127.0.0.1:3001"))
