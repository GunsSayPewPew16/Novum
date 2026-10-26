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

// Average seconds per day with logged focus time, from the 1st of this month through today.
// Days with no time are left out, so the average reflects sessions actually run.
export function monthAverage() {
  const log = read()
  const today = new Date()
  const days = []
  for (let d = 1; d <= today.getDate(); d++) {
    const key = dayKey(new Date(today.getFullYear(), today.getMonth(), d))
    if (log[key]) days.push(log[key])
  }
  return days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0
}

// Test data: fills the last `n` days with varied focus times so the chart and average can be checked.
export function seedTestData(n = 14) {
  const log = read()
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    log[dayKey(d)] = [0, 1800, 900, 2700, 600, 3600, 1200, 0][i % 8] + (i % 3) * 60
  }
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
