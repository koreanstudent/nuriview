'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AuthButton from './AuthButton'
import { Search, Map } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              누리뷰
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/stores"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive('/stores')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Search size={16} />
                가맹점 찾기
              </Link>
              <Link
                href="/map"
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive('/map')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Map size={16} />
                지도
              </Link>
            </nav>
          </div>
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
