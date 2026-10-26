const KEY = "novum.focus"

// Local calendar day as YYYY-MM-DD, so a session belongs to the day it was run.
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

// Called once per second while the timer counts down.
export function addFocusSecond() {
  const log = read()
  const key = dayKey()
  log[key] = (log[key] ?? 0) + 1
  localStorage.setItem(KEY, JSON.stringify(log))
}

// Seconds spent per day for the last `n` days, oldest first, ending today.
export function lastDays(n) {
  const log = read()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return { label: d.toLocaleDateString("en-US", { weekday: "narrow" }), seconds: log[dayKey(d)] ?? 0 }
  })
}
