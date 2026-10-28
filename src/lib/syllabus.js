export const MAX_PDF_BYTES = 3 * 1024 * 1024

export async function analyzeSyllabus(file, fetcher = fetch) {
  if (!file || file.size === 0 || file.size > MAX_PDF_BYTES || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a non-empty PDF no larger than 3 MB.")
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("This file is not a valid PDF. Please choose a PDF syllabus.")
  let response
  try {
    response = await fetcher("/api/syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: bytes,
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    throw new Error("Could not reach the syllabus service. Check your connection and try again.")
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.error || "Could not analyze this syllabus. Please try again.")
  if (!Array.isArray(payload?.modules)) throw new Error("The syllabus service returned an invalid response. Please try again.")
  return payload.modules
}
