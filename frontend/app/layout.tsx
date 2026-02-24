import { AuthProvider } from '@/contexts/auth/AuthContext'
import { NotificationProvider } from '@/contexts/notification/NotificationContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'
import { HomeNavbar } from '@/components/navbar/HomeNavbar'
import { SSEProvider } from '@/components/providers/SSEProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <AuthProvider>
          <NotificationProvider>
            <Interceptor>
              <HomeNavbar />
              <SSEProvider>{children}</SSEProvider>
            </Interceptor>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
