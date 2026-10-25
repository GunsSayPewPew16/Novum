import { useRef, useState } from "react"
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

const SPAN = 14 // days either side of today
const PITCH = 64 // px the row travels for one date
const CURVE = 900 // radius (px) of the flat, gently curved row; large so the bend is slight
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

// One date. `x` is the shared scroll offset in px: each date derives its seat from it on every
// frame, so the row follows the finger one-to-one. The row is flat in 2D, bent onto a large
// circle: dates further from the centre sit slightly lower, and the bend is kept gentle.
function WheelDate({ i, day, x, active, onSelect }) {
  const d = useTransform(x, (v) => i + v / PITCH)
  const px = useTransform(d, (v) => v * PITCH)
  const y = useTransform(d, (v) => CURVE * (1 - Math.cos(v * PITCH / CURVE)))
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
      style={{ x: px, y, scale, opacity, pointerEvents }}
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
  const x = useMotionValue(-SPAN * PITCH) // one scroll offset: 0 puts the first day on the axis
  const [active, setActive] = useState(SPAN)
  const current = useRef(SPAN)
  const dragged = useRef(false)

  const last = DAYS.length - 1
  const snap = (value) => clamp(Math.round(-value / PITCH), 0, last)

  // Every date the row passes the axis updates the selection, so the card follows the drag.
  useMotionValueEvent(x, "change", (value) => {
    const next = snap(value)
    if (next !== current.current) {
      current.current = next
      setActive(next)
    }
  })

  const goTo = (index) => {
    const target = -clamp(index, 0, last) * PITCH
    animate(x, target, { type: "spring", stiffness: 300, damping: 30 })
  }

  return (
    <div
      role="slider" tabIndex={0} aria-label="Select day"
      aria-valuemin={0} aria-valuemax={last} aria-valuenow={active}
      aria-valuetext={`${DAYS[active].label} ${DAYS[active].date}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(current.current + 1)
        if (e.key === "ArrowLeft") goTo(current.current - 1)
      }}
      className="relative -mx-2 mb-5 h-28 touch-pan-y select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70">
      {SPECKS.map(([l, t]) => (
        <i key={`${l}-${t}`} aria-hidden style={{ left: l, top: t }} className="pointer-events-none absolute size-0.5 rounded-full bg-white/50" />
      ))}
      <motion.div
        drag="x"
        style={{ x, cursor: "grab" }}
        // The track is the window the row is seen through; it must not travel with the row.
        transformTemplate={() => "none"}
        dragConstraints={{ left: -last * PITCH, right: 0 }}
        dragElastic={0.1}
        // Drag inertia is projected onto the nearest date, so a flick stops on a day.
        dragTransition={{ power: 0.2, timeConstant: 200, modifyTarget: (t) => -snap(-t) * PITCH }}
        onPointerDown={() => { dragged.current = false }}
        onDragStart={() => { dragged.current = true }}
        className="absolute inset-0">
        {DAYS.map((day, i) => (
          <WheelDate key={i} i={i} day={day} x={x} active={i === active}
            onSelect={(n) => !dragged.current && goTo(n)} />
        ))}
      </motion.div>
    </div>
  )
}
