import { AuthProvider } from '@/contexts/auth/AuthContext'
import { NotificationProvider } from '@/contexts/notification/NotificationContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'
import { ReactNode } from 'react'
import { SSEProvider } from '@/components/providers/SSEProvider'
import { HomeNavbar } from '@/components/navbar/HomeNavbar'

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
              <SSEProvider>
                <HomeNavbar />
                {children}
              </SSEProvider>
            </NotificationProvider>
          </Interceptor>
        </AuthProvider>
      </body>
    </html>
  )
}
