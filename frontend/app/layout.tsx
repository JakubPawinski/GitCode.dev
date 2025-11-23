import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="from-background via-background to-primary/100 text-foreground bg-background h-screen">
        {children}
      </body>
    </html>
  )
}
