import { AuthProvider } from '@/contexts/auth/AuthContext'
import { NotificationProvider } from '@/contexts/notification/NotificationContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'
import { ReactNode } from 'react'
import { SSEProvider } from '@/components/providers/SSEProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <AuthProvider>
          <Interceptor>
            <NotificationProvider>
              <SSEProvider>{children}</SSEProvider>
            </NotificationProvider>
          </Interceptor>
        </AuthProvider>
      </body>
    </html>
  )
}
