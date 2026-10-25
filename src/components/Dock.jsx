import * as Tabs from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
import { Home, Star, Asterisk, Radar, User } from "lucide-react"
import { cn } from "@/lib/utils"

export const TABS = [
  { id: "home", label: "Home", icon: Home, fill: true },
  { id: "explore", label: "Explore", icon: Star },
  { id: "session", label: "Session", icon: Asterisk, center: true },
  { id: "insights", label: "Insights", icon: Radar },
  { id: "profile", label: "Profile", icon: User },
]
const spring = { type: "spring", stiffness: 420, damping: 32 }

export default function Dock({ value, onChange }) {
  return (
    <Tabs.Root value={value} onValueChange={onChange} className="absolute inset-x-2 bottom-3">
      <Tabs.List aria-label="Primary" className="flex h-[72px] items-center justify-between rounded-3xl border border-white/10 bg-white/[0.05] px-[18px] backdrop-blur-xl">
        {TABS.map(({ id, label, icon: Icon, center, fill }) => {
          const on = value === id
          return (
            <Tabs.Trigger key={id} value={id} aria-label={label}
              className={cn(
                "relative grid place-items-center outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
                center
                  ? "h-10 w-16 rounded-full bg-gradient-to-br from-[#F7A263] to-[#D95F2C] text-white shadow-[0_0_24px_rgba(251,146,60,.45)]"
                  : cn("size-5 transition-colors before:absolute before:-inset-3 before:content-['']", on ? "text-white" : "text-white/60 hover:text-white")
              )}>
              {on && !center && (
                <motion.span layoutId="dock-glow" transition={spring} className="absolute -inset-3 rounded-full bg-amber-300/10 blur-md" />
              )}
              <motion.span whileTap={{ scale: 0.88 }} className="relative grid place-items-center">
                <Icon size={20} strokeWidth={center ? 2 : 1.5} fill={fill && on ? "currentColor" : "none"} />
              </motion.span>
              {on && center && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute -inset-1 rounded-full border-2 border-amber-300/40" />
              )}
            </Tabs.Trigger>
          )
        })}
      </Tabs.List>
    </Tabs.Root>
  )
}
