import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { UserPreferencesSync } from '@/components/user-preferences-sync'
import { PWAInstaller } from '@/components/pwa-installer'
import { LazyThirdPartyScripts } from '@/components/lazy-third-party-scripts'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DigitalMix - Free Digital Tools for Developer',
  description: 'Free digital tools to simplify your data and dev workflow. Database tools, developer utilities, business calculators, and file tools.',
  keywords: ['developer tools', 'database tools', 'file utilities', 'KPI calculator', 'pdf tools', 'profit margins', 'json formatter', 'sql formatter', 'uuid generator', 'hash generator'],
  authors: [{ name: 'DigitalMix', url: 'https://www.digitalmix.dev' }],
  creator: 'DigitalMix',
  publisher: 'DigitalMix',
  alternates: {
    canonical: 'https://www.digitalmix.dev',
  },
  openGraph: {
    title: 'DigitalMix - Free Digital Tools for Developers',
    description: 'Technical solutions and smart tools for developers and creators.',
    url: 'https://www.digitalmix.dev',
    siteName: 'DigitalMix',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DigitalMix - Free Digital Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigitalMix - Free Digital Tools',
    description: 'Free tools for developers: JSON formatter, SQL tools, hash generator, and more.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
      {
        rel: 'icon',
        sizes: '192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  other: {
    'google-adsense-account': 'ca-pub-5995253364983936',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  width: 'device-width',
  initialScale: 1,
}

const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://www.digitalmix.dev/#webapp',
      name: 'DigitalMix',
      description: 'Free digital tools for developers and creators',
      url: 'https://www.digitalmix.dev',
      applicationCategory: 'DeveloperApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      image: 'https://www.digitalmix.dev/og-image.png',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.digitalmix.dev/tools?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.digitalmix.dev/#organization',
      name: 'DigitalMix',
      url: 'https://www.digitalmix.dev',
      logo: 'https://www.digitalmix.dev/digitalmix.png',
      sameAs: [
        'https://www.digitalmix.dev',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        url: 'https://www.digitalmix.dev/about',
      },
    },
    {
      '@type': 'Website',
      '@id': 'https://www.digitalmix.dev/#website',
      url: 'https://www.digitalmix.dev',
      name: 'DigitalMix',
      description: 'Free digital tools for developers',
      publisher: {
        '@id': 'https://www.digitalmix.dev/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.digitalmix.dev?s={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash inline theme loader */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('digitalmix-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}}catch(e){}})()`,
          }}
        />
        {/* JSON-LD Schema */}
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-background`}>
        <AuthProvider>
          <PWAInstaller />
          <ThemeProvider defaultTheme="dark" enableSystem>
            <UserPreferencesSync />
            {children}
            <Toaster />
          </ThemeProvider>

          <LazyThirdPartyScripts />
        </AuthProvider>
      </body>
    </html>
  )
}
