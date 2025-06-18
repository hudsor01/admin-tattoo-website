"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeSwitcher() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = React.useCallback(() => {
    const currentTheme = theme || resolvedTheme
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    
    
    setTheme(newTheme)
    
    // Force immediate DOM update
    setTimeout(() => {
      const html = document.documentElement
      html.classList.remove('light', 'dark')
      html.classList.add(newTheme)
      html.setAttribute('data-theme', newTheme)
      
    }, 0)
  }, [theme, resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <span className="sr-only">Loading...</span>
      </Button>
    )
  }

  const currentTheme = theme || resolvedTheme
  const isDark = currentTheme === "dark"

  return (
    <Button
      variant="outline" 
      size="icon"
      onClick={handleToggle}
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}