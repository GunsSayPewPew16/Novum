import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Asterisk, Blend, ChevronRight, Lightbulb, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import DateStrip from "@/components/DateStrip"
import Dock, { TABS } from "@/components/Dock"
import { cn } from "@/lib/utils"

const glass = "rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-md"
// [label, fill height in px (track = 48), tone]
const BARS = [["S", 12], ["M", 16], ["T", 6], ["W", 20], ["T", 40, "hot"], ["F", 18, "warm"], ["S", 38, "hot"]]
const TONE = { hot: "bg-gradient-to-b from-[#FF9A63] to-[#E0522B]", warm: "bg-[#E07846]/60" }

function Header() {
  return (
    <header className="flex h-8 items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-full bg-white/15 shadow-[0_0_24px_rgba(255,170,90,.5)]">
          <Asterisk size={20} strokeWidth={2} />
        </div>
        <span className="font-serif text-[26px] font-medium italic tracking-[-0.01em]">Novum</span>
      </div>
    </header>
  )
}

const Meta = ({ icon: Icon, children }) => (
  <span className="flex items-center gap-1.5 text-xs text-white/80">
    <Icon size={14} strokeWidth={1.5} /> {children}
  </span>
)

function Hero() {
  return (
    <section className={cn(glass, "relative isolate h-[280px] overflow-hidden bg-gradient-to-b from-orange-500/[0.12] via-ink/55 to-ink/85")}>
      <div aria-hidden className="absolute inset-x-0 top-6 -z-10 flex justify-center blur-[6px]">
        <motion.div className="flex flex-col items-center" animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <div className="size-10 rounded-full bg-orange-100/40" />
          <div className="-mt-1 h-20 w-28 rounded-t-[56px] bg-gradient-to-b from-orange-100/35 to-transparent" />
        </motion.div>
      </div>
      <div className="absolute inset-x-6 bottom-6 flex flex-col items-center text-center">
        <h2 className="font-serif text-[28px] font-medium italic leading-8 tracking-[-0.01em]">Start A New Session</h2>
        <p className="mt-2 whitespace-nowrap text-xs leading-4 text-white/60">
          Set a focus block and track your study time<br />to see how your sessions add up.
        </p>
        <div className="mt-2 flex gap-4">
          <Meta icon={Play}>10 min</Meta>
          <Meta icon={Lightbulb}>Guided</Meta>
        </div>
        <Button asChild className="mt-4 h-10 gap-2 px-6 text-[13px]">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Play size={14} strokeWidth={1.5} /> Start Timer
          </motion.button>
        </Button>
      </div>
    </section>
  )
}

function Energy() {
  return (
    <section className={cn(glass, "relative h-36")}>
      <div className="absolute inset-x-4 top-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-white/[0.08] text-white/75">
          <Blend size={16} strokeWidth={1.5} />
        </span>
        <h3 className="text-[13px] font-medium text-white/60">Energy Forecast</h3>
        <ChevronRight size={16} strokeWidth={1.5} className="ml-auto mr-2 text-white/60" />
      </div>
      <p className="absolute bottom-4 left-4 text-[40px] font-normal leading-[48px] tracking-[-0.03em]">78%</p>
      <div className="absolute bottom-4 right-4 flex gap-4" role="img" aria-label="Weekly energy distribution">
        {BARS.map(([d, h, tone], i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 text-[10px] font-semibold leading-3 text-white/60">
            <div className="flex h-12 w-2 items-end overflow-hidden rounded-full bg-white/[0.07]">
              <motion.i initial={{ height: 0 }} animate={{ height: h }} transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                className={cn("w-full rounded-full", TONE[tone] ?? "bg-white/20")} />
            </div>
            {d}
          </div>
        ))}
      </div>
    </section>
  )
}

function Metrics() {
  const Cell = ({ value, label }) => (
    <div className="flex flex-col items-center gap-1">
      <b className="text-base font-medium leading-5">{value}</b>
      <span className="text-xs leading-4 text-white/60">{label}</span>
    </div>
  )
  return (
    <section className={cn(glass, "grid h-16 grid-cols-3 items-center")}>
      <Cell value="9 minutes" label="Average session" />
      <Cell value="Calm" label="Current mood" />
      <Cell value={<><span className="text-[#FF8A50]">8:30</span> <span className="text-xs font-normal text-white/60">PM</span></>} label="Meditation Time" />
    </section>
  )
}

function Placeholder({ label }) {
  return (
    <div className={cn(glass, "grid h-64 place-items-center p-6 text-center")}>
      <div>
        <h2 className="text-2xl font-medium leading-7">{label}</h2>
        <p className="mt-2 text-xs text-white/60">This screen is ready for your content.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState("home")
  return (
    <div className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-ink font-sans text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_14%_at_50%_16%,rgba(255,206,140,.9),rgba(255,150,70,.7)_40%,rgba(255,130,50,0)_100%),radial-gradient(150%_46%_at_50%_0%,#C9581F_0%,#8E3E1A_48%,rgba(18,15,13,0)_100%)]" />
      <main className="relative h-full overflow-y-auto px-2 pb-24 pt-4 [scrollbar-width:none]">
        <div className="flex flex-col gap-2">
          <Header />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }} className="flex flex-col gap-2">
              {tab === "home" ? (
                <>
                  <DateStrip />
                  <Hero />
                  <Energy />
                  <Metrics />
                </>
              ) : (
                <Placeholder label={TABS.find((t) => t.id === tab).label} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Dock value={tab} onChange={setTab} />
    </div>
  )
}
