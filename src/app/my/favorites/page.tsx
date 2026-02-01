'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getFavoritesByUserId, removeFavorite } from '@/lib/favorites'
import { User } from '@supabase/supabase-js'
import { Heart, MapPin, Trash2, Loader2 } from 'lucide-react'

interface FavoriteStore {
  store_id: number
  created_at: string
  stores: {
    id: number
    name: string
    address: string
    road_address: string
  }
}

export default function MyFavoritesPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<FavoriteStore[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        router.push('/login?redirect=/my/favorites')
        return
      }
      setUser(currentUser)
      fetchFavorites(currentUser.id)
    }
    init()
  }, [router])

  async function fetchFavorites(userId: string) {
    const { data, error } = await getFavoritesByUserId(userId)
    if (!error && data) {
      setFavorites(data as unknown as FavoriteStore[])
    }
    setLoading(false)
  }

  async function handleRemove(storeId: number) {
    if (!user) return

    setRemovingId(storeId)
    await removeFavorite(user.id, storeId)
    setFavorites(favorites.filter(f => f.store_id !== storeId))
    setRemovingId(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="text-red-500" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">즐겨찾기</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">즐겨찾기한 가맹점이 없습니다.</p>
            <Link
              href="/stores"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              가맹점 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div
                key={fav.store_id}
                className="bg-white rounded-lg p-4 border border-gray-100 flex items-center justify-between"
              >
                <Link
                  href={`/stores/${fav.stores.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                    {fav.stores.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span className="truncate">{fav.stores.road_address || fav.stores.address}</span>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(fav.store_id)}
                  disabled={removingId === fav.store_id}
                  className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="즐겨찾기 해제"
                >
                  {removingId === fav.store_id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
