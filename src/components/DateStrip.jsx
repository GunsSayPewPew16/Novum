import { useRef, useState } from "react"
import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform, useVelocity } from "framer-motion"
import { cn } from "@/lib/utils"

const SPAN = 14 // days either side of today
const STEP = 20 // degrees between neighbouring dates while the wheel is spinning
const R = 200 // wheel radius (px) while spinning
const PITCH = 64 // px between dates at rest
const SPRING = { type: "spring", stiffness: 300, damping: 30 }
const rad = (deg) => (deg * Math.PI) / 180
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// session progress rings for the last few days, keyed by offset from today
const PROGRESS = { "-3": 0.85, "-2": 0.22, "-1": 0.72, 0: 0.78 }
// tiny bokeh specks [left, top] in px
const SPECKS = [[20, 15], [90, 53], [107, 90], [134, 105], [182, 98], [223, 98], [299, 108], [305, 15], [370, 18]]

const DAYS = Array.from({ length: SPAN * 2 + 1 }, (_, i) => {
  const dt = new Date()
  dt.setDate(dt.getDate() + i - SPAN)
  return {
    date: String(dt.getDate()).padStart(2, "0"),
    label: dt.toLocaleDateString("en-US", { weekday: "short" }),
    progress: PROGRESS[i - SPAN],
  }
})

function Ring({ p, strong }) {
  const r = 19
  const c = 2 * Math.PI * r
  const base = { cx: 20, cy: 20, fill: "none", strokeLinecap: "round" }
  return (
    <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 size-10">
      {strong && (
        <>
          <circle {...base} r={r} stroke="rgba(255,255,255,.25)" strokeWidth={2} />
          <circle {...base} r={15} stroke="rgba(255,255,255,.3)" strokeWidth={1} />
        </>
      )}
      <circle {...base} r={r} stroke={`rgba(255,255,255,${strong ? 0.95 : 0.75})`} strokeWidth={2}
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 20 20)" />
    </svg>
  )
}

// One date. `wheel` is the spring-driven (fractional) index at the centre and `k` (0-1) is how fast
// the wheel is spinning: at rest the dates lie flat on a gentle arc, in motion they curve onto a
// 3D dial and tilt away from the viewer.
function WheelDate({ i, day, wheel, k, active, onSelect }) {
  const d = useTransform(wheel, (v) => i - v)
  const angle = useTransform(d, (v) => clamp(v * STEP, -90, 90))
  const x = useTransform([d, k, angle], ([dv, kv, a]) => dv * PITCH * (1 - kv) + R * Math.sin(rad(a)) * kv)
  const y = useTransform(d, (v) => 9.8 * (Math.sqrt(v * v + 0.02) - 0.1414))
  const z = useTransform([k, angle], ([kv, a]) => -kv * R * (1 - Math.cos(rad(a))))
  const rotateY = useTransform([k, angle], ([kv, a]) => a * kv)
  const scale = useTransform(d, (v) => {
    const a = Math.abs(v)
    return a < 1 ? 1.15 - 0.25 * a : Math.max(0.8, 0.9 - 0.04 * (a - 1))
  })
  const opacity = useTransform(d, (v) => {
    const a = Math.abs(v)
    return a < 1 ? 1 - 0.4 * a : Math.max(0.45, 0.6 - 0.05 * (a - 1))
  })
  const pointerEvents = useTransform(d, (v) => (Math.abs(v) > 3.2 ? "none" : "auto"))
  const p = day.progress

  return (
    <motion.button tabIndex={-1} aria-hidden onClick={() => onSelect(i)}
      style={{ x, y, z, rotateY, scale, opacity, pointerEvents }}
      className="absolute left-1/2 top-3 -ml-7 flex w-14 flex-col items-center gap-3 outline-none">
      <span className={cn("relative grid size-10 place-items-center rounded-full text-base font-medium transition-colors", p > 0.5 ? "bg-white/[0.06]" : "bg-white/[0.24]")}>
        {day.date}
        {p && <Ring p={p} strong={active} />}
      </span>
      <span className={cn("text-sm leading-[17px] transition-colors", active ? "font-semibold text-white" : "text-white/90")}>
        {day.label}
      </span>
    </motion.button>
  )
}

export default function DateStrip() {
  const target = useMotionValue(SPAN) // where the wheel should land
  const wheel = useSpring(target, SPRING) // what is drawn: spring-chased rotation
  const k = useSpring(useTransform(useVelocity(wheel), (v) => clamp(Math.abs(v) / 5, 0, 1)), { stiffness: 200, damping: 30 })
  const [active, setActive] = useState(SPAN)
  const startAt = useRef(SPAN)
  const panned = useRef(false)

  useMotionValueEvent(target, "change", (v) => setActive(Math.round(v)))
  const go = (i) => target.set(clamp(Math.round(i), 0, DAYS.length - 1))

  return (
    <motion.div
      role="slider" tabIndex={0} aria-label="Select day"
      aria-valuemin={0} aria-valuemax={DAYS.length - 1} aria-valuenow={active}
      aria-valuetext={`${DAYS[active].label} ${DAYS[active].date}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1)
        if (e.key === "ArrowLeft") go(active - 1)
      }}
      // swiping anywhere on the strip spins it; releasing flings to the nearest date
      onPanStart={() => { startAt.current = target.get(); panned.current = false }}
      onPan={(_, { offset }) => {
        if (Math.abs(offset.x) > 4) panned.current = true
        target.set(clamp(startAt.current - offset.x / PITCH, -0.4, DAYS.length - 0.6))
      }}
      onPanEnd={(_, { velocity }) => {
        go(target.get() - velocity.x / 600)
        setTimeout(() => { panned.current = false }, 0)
      }}
      className="relative -mx-2 mb-5 h-28 cursor-grab touch-pan-y select-none overflow-hidden outline-none [perspective:800px] focus-visible:ring-2 focus-visible:ring-amber-300/70 active:cursor-grabbing">
      {SPECKS.map(([l, t]) => (
        <i key={`${l}-${t}`} aria-hidden style={{ left: l, top: t }} className="pointer-events-none absolute size-0.5 rounded-full bg-white/50" />
      ))}
      {DAYS.map((day, i) => (
        <WheelDate key={i} i={i} day={day} wheel={wheel} k={k} active={i === active}
          onSelect={(n) => !panned.current && go(n)} />
      ))}
    </motion.div>
  )
}
