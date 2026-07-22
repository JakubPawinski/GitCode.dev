'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme/ThemeContext'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      className="gc-glass text-gc-text inline-flex h-9 w-9 items-center justify-center rounded-full"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
