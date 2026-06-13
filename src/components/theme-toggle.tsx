'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useSoundSettings } from '@/contexts/sound-context'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)
  const { playSound } = useSoundSettings()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration gate; sets initial theme from localStorage/media-query on mount
    setMounted(true)
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const initialTheme = stored || (prefersLight ? 'light' : 'dark')
    setTheme(initialTheme)
  }, [])

  const updateTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    updateTheme(newTheme)
  }

  if (!mounted) {
    return (
      <button
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="size-4" />
      </button>
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // Play sound feedback on keyboard activation (Enter or Space)
    if (e.key === "Enter" || e.key === " ") {
      playSound("click", true);
    }
  };

  return (
    <button
      onPointerDown={() => playSound("click", true)}
      onKeyDown={handleKeyDown}
      onClick={toggleTheme}
      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  )
}
