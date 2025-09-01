import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://colemearchy.com'),
  title: {
    default: "Cole IT AI - Tech & AI Blog",
    template: "%s | Cole IT AI"
  },
  description: "AI, technology, and software development insights from Cole IT AI.",
  keywords: ["AI", "technology", "software development", "machine learning", "programming"],
  authors: [{ name: "Cole IT AI" }],
  creator: "Cole IT AI",
  publisher: "Cole IT AI",
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://colemearchy.com",
    siteName: "Cole IT AI",
    title: "Cole IT AI - Tech & AI Blog",
    description: "AI, technology, and software development insights from Cole IT AI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cole IT AI"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Cole IT AI",
    description: "AI, technology, and software development insights from Cole IT AI.",
    creator: "@coleitai",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://colemearchy.com",
    languages: {
      'ko': '/ko',
      'en': '/en',
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cole IT AI',
    url: 'https://colemearchy.com',
    description: 'AI, technology, and software development insights from Cole IT AI.',
    publisher: {
      '@type': 'Organization',
      name: 'Cole IT AI'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://colemearchy.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6256509279584947"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
