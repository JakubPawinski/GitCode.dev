import { AuthProvider } from '@/contexts/auth/AuthContext'
import './globals.css'
import { Interceptor } from '@/api/Interceptor'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <AuthProvider>
          <Interceptor>{children}</Interceptor>
        </AuthProvider>
      </body>
    </html>
  )
}
