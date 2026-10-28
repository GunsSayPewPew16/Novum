import pg from "pg"

let pool

export function getDatabase() {
  const uri = process.env.DATABASE_URL
  if (!uri) throw new Error("DATABASE_URL is not configured")
  if (!pool) {
    const url = new URL(uri)
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL must be a PostgreSQL connection string")
    if (["sslmode", "sslrootcert", "sslcert", "sslkey"].some((option) => url.searchParams.has(option))) {
      throw new Error("Configure TLS with DATABASE_CA_CERT, not DATABASE_URL SSL options")
    }
    if (!process.env.DATABASE_CA_CERT) throw new Error("DATABASE_CA_CERT is not configured")
    pool = new pg.Pool({
      connectionString: uri,
      max: 1,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      ssl: { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, "\n"), rejectUnauthorized: true },
    })
    pool.on("error", () => console.error("An idle database connection failed; the next query will reconnect."))
  }
  return pool
}

// A single conditional upsert enforces the global UTC-day limit across instances.
export async function reserveAnalysis(now = new Date(), db) {
  const limit = Number(process.env.GEMINI_DAILY_LIMIT || 20)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000) throw new Error("Invalid GEMINI_DAILY_LIMIT")
  const day = now.toISOString().slice(0, 10)
  db ??= getDatabase()
  const result = await db.query(`
    INSERT INTO app_private.analysis_usage AS counter (day, count)
    VALUES ($1::date, 1)
    ON CONFLICT (day) DO UPDATE SET count = counter.count + 1
    WHERE counter.count < $2
    RETURNING count
  `, [day, limit])
  return result.rowCount === 1
}
