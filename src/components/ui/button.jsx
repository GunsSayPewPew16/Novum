import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-300/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        glow: "bg-white text-ink shadow-[0_0_32px_rgba(255,170,90,.35)] hover:bg-white/90",
        glass: "border border-white/10 bg-white/5 text-white/90 backdrop-blur-md hover:bg-white/10",
      },
      size: { default: "h-12 rounded-full px-6", icon: "size-12 rounded-full" },
    },
    defaultVariants: { variant: "glow", size: "default" },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }
