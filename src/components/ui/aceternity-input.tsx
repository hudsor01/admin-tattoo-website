'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"

export interface AceternityInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string
}

const AceternityInput = React.forwardRef<HTMLInputElement, AceternityInputProps>(
  ({ className, type, wrapperClassName, ...props }, ref) => {
    const radius = 100
    const [visible, setVisible] = React.useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
      const { left, top } = currentTarget.getBoundingClientRect()

      mouseX.set(clientX - left)
      mouseY.set(clientY - top)
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
              var(--gradient-from, #ef4444),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className={cn(
          "rounded-lg p-[1px] transition-all duration-300 group/input",
          wrapperClassName
        )}
      >
        <input
          type={type}
          className={cn(
            `flex h-10 w-full rounded-md border-none bg-gray-800 px-3 py-2 text-sm text-white
            transition duration-400 placeholder:text-gray-400
            focus-visible:ring-[1.5px] focus-visible:ring-red-400/60 focus-visible:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
            `,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  }
)

AceternityInput.displayName = "AceternityInput"

export { AceternityInput }
