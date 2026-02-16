import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Editor',
  description: 'AI-powered video editing application'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
