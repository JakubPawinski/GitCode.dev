import type { Config } from 'tailwindcss'
import { colors } from './consts/theme/colors'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        foreground: colors.foreground,
        background: colors.background,
      },
    },
  },
  plugins: [],
}

export default config
