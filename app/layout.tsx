import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gyara Ni',
  description: 'Système de gestion d\'inventaire - Taste the Boldness!',
  generator: 'v0.app',
  manifest: '/manifest.json',
  keywords: ['inventaire', 'gestion', 'stock', 'commandes', 'produits'],
  authors: [{ name: 'Emma Lokadi & Nell Mvele' }],
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gyara Ni',
  },
}

export const viewport: Viewport = {
  themeColor: '#ea7c1b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gyara Ni" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('Service Worker enregistré avec succès:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Échec de l\'enregistrement du Service Worker:', error);
                    });
                });
              }
            `,
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
