import { useState } from "react"
import { motion } from "framer-motion"
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

function DotClock({ hours, minutes }) {
  const text = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  return (
    <div role="timer" aria-label={`${hours} hours ${minutes} minutes`} className="flex items-center justify-center gap-3">
      {[...text].map((ch, i) => (
        <DotDigit key={i} char={ch} />
      ))}
    </div>
  )
}

// A vertical wheel of values; the selected value sits in the centre and the list scrolls to it.
function Wheel({ label, values, value, onChange }) {
  const index = values.indexOf(value)
  const step = (d) => onChange(values[(index + d + values.length) % values.length])
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
        onWheel={(e) => step(e.deltaY > 0 ? 1 : -1)}
        className="relative flex h-[200px] w-24 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-amber-300/70"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/80 to-transparent" />
        {[-2, -1, 0, 1, 2].map((offset) => {
          const v = values[(index + offset + values.length) % values.length]
          const mid = offset === 0
          return (
            <motion.button
              key={v}
              type="button"
              tabIndex={-1}
              onClick={() => onChange(v)}
              initial={false}
              animate={{ opacity: mid ? 1 : 0.35 - Math.abs(offset) * 0.1, y: offset * 40, scale: mid ? 1.15 : 0.85 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
              className={cn("absolute font-serif text-[40px] font-medium italic leading-none", mid ? "text-[#FF8A50]" : "text-white")}
            >
              {String(v).padStart(2, "0")}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

const HOURS = Array.from({ length: 12 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export default function TimerScreen({ onBack }) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(10)

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
        <h2 className="text-center font-serif text-[28px] font-medium italic leading-8 tracking-[-0.01em]">Set your focus time</h2>
        <p className="mt-2 text-center text-xs leading-4 text-white/60">Choose hours and minutes, then start when you are ready.</p>

        <div className="mt-8">
          <DotClock hours={hours} minutes={minutes} />
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Wheel label="Hours" values={HOURS} value={hours} onChange={setHours} />
          <Wheel label="Minutes" values={MINUTES} value={minutes} onChange={setMinutes} />
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild disabled={hours === 0 && minutes === 0} className="h-10 gap-2 px-6 text-[13px]">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Play size={14} strokeWidth={1.5} /> Begin Session
            </motion.button>
          </Button>
        </div>
      </div>
    </section>
  )
}
