'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { signOut, onAuthStateChange } from '@/lib/auth'
import { LogIn, LogOut, MessageSquare, Heart } from 'lucide-react'

export default function AuthButton() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  if (loading) {
    return <div className="w-20 h-9 bg-gray-100 rounded-lg animate-pulse" />
  }

  if (user) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/my/favorites"
          className="flex items-center gap-1.5 px-2 py-2 text-sm text-gray-600 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
          title="즐겨찾기"
        >
          <Heart size={16} />
        </Link>
        <Link
          href="/my/reviews"
          className="flex items-center gap-1.5 px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="내 후기"
        >
          <MessageSquare size={16} />
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
    >
      <LogIn size={16} />
      <span className="hidden sm:inline">로그인</span>
    </Link>
  )
}
