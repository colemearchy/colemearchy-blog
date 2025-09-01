import Link from 'next/link'
import { navigationItems } from '@/lib/navigation'

interface PageLayoutProps {
  locale: string
  currentPath: string
  children: React.ReactNode
}

export default function PageLayout({ locale, currentPath, children }: PageLayoutProps) {
  const lang = locale === 'en' ? 'en' : 'ko'
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <Link href={`/${locale}`} className="text-3xl font-serif italic">
              Cole IT AI
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/ko${currentPath}`}
                className={`px-3 py-1 rounded font-medium ${lang === 'ko' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                KOR
              </Link>
              <Link
                href={`/en${currentPath}`}
                className={`px-3 py-1 rounded font-medium ${lang === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                ENG
              </Link>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex justify-center items-center gap-6 pb-4" aria-label="Main navigation">
            {navigationItems[lang].map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href === '/' ? '' : item.href}`}
                className={`text-sm font-medium pb-2 ${
                  currentPath === item.href
                    ? 'text-gray-900 border-b-2 border-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  )
}