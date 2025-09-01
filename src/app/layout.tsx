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
    default: "Colemearchy - Biohacking, Tech Leadership, and Sovereign Living",
    template: "%s | Colemearchy"
  },
  description: "Raw insights on biohacking, tech leadership, and building a sovereign life. From a tech director who refuses to follow the script.",
  keywords: ["biohacking", "tech leadership", "startup growth", "SEO", "AI", "personal freedom", "investing"],
  authors: [{ name: "Colemearchy" }],
  creator: "Colemearchy",
  publisher: "Colemearchy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://colemearchy.com",
    siteName: "Colemearchy",
    title: "Colemearchy - Biohacking, Tech Leadership, and Sovereign Living",
    description: "Raw insights on biohacking, tech leadership, and building a sovereign life.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Colemearchy"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Colemearchy",
    description: "Raw insights on biohacking, tech leadership, and building a sovereign life.",
    creator: "@colemearchy",
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
    canonical: "https://colemearchy.com"
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
    name: 'Colemearchy',
    url: 'https://colemearchy.com',
    description: 'Raw insights on biohacking, tech leadership, and building a sovereign life.',
    publisher: {
      '@type': 'Person',
      name: 'Colemearchy'
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
