import { useEffect, useRef, useState } from "react"
import { animate, motion, useMotionValue, useTransform } from "framer-motion"
import { ArrowLeft, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 5x7 dot-matrix glyphs for digits and the colon. "#" is a lit dot.
const GLYPHS = {
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  ":": [".....", "..#..", "..#..", ".....", "..#..", "..#..", "....."],
}

function DotDigit({ char }) {
  return (
    <div className="grid grid-cols-5 gap-[5px]" aria-hidden>
      {GLYPHS[char].flatMap((row, r) =>
        [...row].map((cell, c) => (
          <i
            key={`${r}-${c}`}
            className={cn(
              "size-[7px] rounded-full transition-colors duration-300",
              cell === "#" ? "bg-[#FF9A63] shadow-[0_0_8px_rgba(255,154,99,.7)]" : "bg-white/[0.06]"
            )}
          />
        ))
      )}
    </div>
  )
}

const pad = (n) => String(n).padStart(2, "0")
const fmt = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}`

function DotClock({ text }) {
  return (
    <div role="timer" aria-label={text} className="flex items-center justify-center gap-3">
      {[...text].map((ch, i) => (
        <DotDigit key={i} char={ch} />
      ))}
    </div>
  )
}

const STEP_DEG = 30 // angle between neighbouring values on the drum
const RADIUS = 96 // drum radius in px

// Signed distance (in values) from the drum's front, wrapped so the short way round is used.
const wrapDist = (i, pos, n) => ((((i - pos) % n) + n + n / 2) % n) - n / 2

// One value on the drum. Every value reads the same shared position, so the whole drum turns together.
function DialItem({ v, i, n, pos }) {
  const transform = useTransform(pos, (p) => `rotateX(${-wrapDist(i, p, n) * STEP_DEG}deg) translateZ(${RADIUS}px)`)
  const opacity = useTransform(pos, (p) => Math.max(0, 1 - Math.abs(wrapDist(i, p, n)) * 0.3))
  const color = useTransform(pos, (p) => (Math.abs(wrapDist(i, p, n)) < 0.5 ? "#FF8A50" : "#ffffff"))
  return (
    <motion.button
      type="button"
      tabIndex={-1}
      data-value={v}
      style={{ transform, opacity, color, backfaceVisibility: "hidden" }}
      className="absolute inset-x-0 top-1/2 -mt-5 h-10 font-serif text-[40px] font-medium italic leading-10"
    >
      {String(v).padStart(2, "0")}
    </motion.button>
  )
}

// A vertical wheel of values, drawn as a 3D drum; the selected value sits at the front.
function Wheel({ label, values, value, onChange }) {
  const index = values.indexOf(value)
  const n = values.length
  const pos = useMotionValue(index)
  // Turn the drum the shortest way to the new value, with a spring, so every step is a continuous rotation.
  useEffect(() => {
    const current = pos.get()
    const delta = wrapDist(index, current, n)
    const controls = animate(pos, current + delta, { type: "spring", stiffness: 180, damping: 26, mass: 0.9 })
    return () => controls.stop()
  }, [index, n, pos])
  const step = (d) => onChange(values[(index + d + values.length) % values.length])
  // Drag and wheel accumulate distance; each ~18px of travel moves the wheel by one value.
  const travel = useRef(0)
  const last = useRef(null)
  const walk = useRef(null)
  // A press that moves little is a tap: it walks to the value under the pointer on release.
  const press = useRef({ moved: 0, target: null })
  const current = useRef(value)
  current.current = value
  const STEP_PX = 18
  // One value per gesture event, so the spring animation plays for every step.
  const advance = (delta) => {
    travel.current += delta
    if (Math.abs(travel.current) < STEP_PX) return
    const dir = Math.sign(travel.current)
    travel.current = 0
    clearTimeout(walk.current)
    step(dir > 0 ? -1 : 1)
  }
  // Clicking a far value walks to it one step at a time, the shorter way round the wheel.
  const walkTo = (target) => {
    clearTimeout(walk.current)
    const tick = () => {
      const n = values.length
      const i = values.indexOf(current.current)
      const t = values.indexOf(target)
      if (i === t) return
      const dir = (t - i + n) % n <= n / 2 ? 1 : -1
      onChange(values[(i + dir + n) % n])
      walk.current = setTimeout(tick, 90)
    }
    tick()
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-white/60">{label}</span>
      <div
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={value}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); step(-1) }
          if (e.key === "ArrowDown") { e.preventDefault(); step(1) }
        }}
        onWheel={(e) => advance(e.deltaY)}
        onPointerDown={(e) => {
          last.current = e.clientY
          press.current = { moved: 0, target: e.target.closest("[data-value]")?.dataset.value ?? null }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (last.current === null) return
          press.current.moved += Math.abs(e.clientY - last.current)
          advance(last.current - e.clientY)
          last.current = e.clientY
        }}
        onPointerUp={() => {
          const { moved, target } = press.current
          if (last.current !== null && moved < 6 && target !== null) walkTo(Number(target))
          last.current = null
          travel.current = 0
        }}
        onPointerCancel={() => { last.current = null; travel.current = 0 }}
        style={{ touchAction: "none", cursor: "ns-resize" }}
        className="relative flex h-[200px] w-24 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-amber-300/70"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="absolute inset-0 [perspective:360px]">
          <div className="absolute inset-0 [transform-style:preserve-3d]">
            {values.map((v, i) => (
              <DialItem key={v} v={v} i={i} n={n} pos={pos} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export default function TimerScreen({ onBack, onTick }) {
  // The countdown reports each running second through the latest onTick, without restarting the interval.
  const tick = useRef(onTick)
  tick.current = onTick
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(10)
  // running: counting down; remaining: seconds left (null when idle, so the picker shows)
  const [remaining, setRemaining] = useState(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      tick.current?.()
      setRemaining((s) => {
        if (s <= 1) { setRunning(false); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const begin = () => { setRemaining(hours * 3600 + minutes * 60); setRunning(true) }
  const reset = () => { setRunning(false); setRemaining(null) }
  const shown = remaining ?? hours * 3600 + minutes * 60
  const finished = remaining === 0

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="grid size-8 place-items-center rounded-full bg-white/15 text-white/90 outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-amber-300/70"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="text-xs text-white/60">Session timer</span>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-8 backdrop-blur-md">
        <h2 className="text-center font-serif text-[28px] font-medium italic leading-8 tracking-[-0.01em]">
          {finished ? "Session complete" : remaining === null ? "Set your focus time" : running ? "Focus time" : "Paused"}
        </h2>
        <p className="mt-2 text-center text-xs leading-4 text-white/60">
          {remaining === null ? "Scroll the wheels to choose hours and minutes." : finished ? "Reset to set a new session." : "Pause or reset whenever you need."}
        </p>

        <div className="mt-8">
          <DotClock text={fmt(shown)} />
        </div>

        {remaining === null && (
          <div className="mt-8 flex justify-center gap-4">
            <Wheel label="Hours" values={HOURS} value={hours} onChange={setHours} />
            <Wheel label="Minutes" values={MINUTES} value={minutes} onChange={setMinutes} />
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          {remaining !== null && (
            <Button asChild variant="glass" className="h-10 px-5 text-[13px]">
              <motion.button onClick={reset} whileTap={{ scale: 0.96 }}>Reset</motion.button>
            </Button>
          )}
          <Button asChild disabled={remaining === null && hours === 0 && minutes === 0} className="h-10 gap-2 px-6 text-[13px]">
            <motion.button
              onClick={() => (remaining === null || finished ? begin() : setRunning((r) => !r))}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Play size={14} strokeWidth={1.5} /> {remaining === null || finished ? "Start" : running ? "Pause" : "Resume"}
            </motion.button>
          </Button>
        </div>
      </div>
    </section>
  )
}
