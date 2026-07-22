import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth/AuthContext'
import { NotificationProvider } from '@/contexts/notification/NotificationContext'
import { ThemeProvider } from '@/contexts/theme/ThemeContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'
import { HomeNavbar } from '@/components/navbar/HomeNavbar'
import { SSEProvider } from '@/components/providers/SSEProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// Runs before hydration so a returning light-theme visitor never flashes dark first.
const themeInitScript = `(function(){try{var t=localStorage.getItem('gc-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Interceptor>
                <HomeNavbar />
                <SSEProvider>{children}</SSEProvider>
              </Interceptor>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
