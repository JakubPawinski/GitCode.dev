import './globals.css'
import { AuthProvider } from '@/contexts/auth/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}