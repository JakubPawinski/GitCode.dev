import { AuthProvider } from '@/contexts/auth/AuthContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'
import { HomeNavbar } from '@/components/navbar/HomeNavbar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <AuthProvider>
          <Interceptor>
            <HomeNavbar />
            {children}
          </Interceptor>
        </AuthProvider>
      </body>
    </html>
  )
}
