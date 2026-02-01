'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Star, MessageSquare, TrendingUp, MapPin, ChevronRight } from 'lucide-react'

interface RecentReview {
  id: number
  content: string
  rating: number
  is_available: boolean
  created_at: string
  store_id: number
  stores: {
    name: string
    address: string
  }
}

interface PopularStore {
  id: number
  name: string
  address: string
  review_count: number
  avg_rating: number
}

export default function Home() {
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [popularStores, setPopularStores] = useState<PopularStore[]>([])
  const [stats, setStats] = useState({ stores: 0, reviews: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // 최근 후기
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, content, rating, is_available, created_at, store_id, stores(name, address)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (reviews) {
        setRecentReviews(reviews as unknown as RecentReview[])
      }

      // 통계
      const { count: storeCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })

      setStats({
        stores: storeCount || 0,
        reviews: reviewCount || 0,
      })

      setLoading(false)
    }

    fetchData()
  }, [])

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`
    return `${diffDay}일 전`
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gray-50">
      {/* 히어로 섹션 */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">누리뷰</h1>
          <p className="text-lg text-gray-600 mb-8">
            온누리상품권 가맹점 실시간 후기
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/stores"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <MessageSquare size={20} />
              후기 보기
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <MapPin size={20} />
              지도
            </Link>
          </div>

          {/* 통계 */}
          <div className="flex justify-center gap-8 mt-10 pt-8 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.stores.toLocaleString()}</p>
              <p className="text-sm text-gray-500">가맹점</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.reviews.toLocaleString()}</p>
              <p className="text-sm text-gray-500">후기</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 최근 후기 */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              최근 후기
            </h2>
            <Link href="/stores" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              더보기 <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              로딩 중...
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              아직 후기가 없습니다. 첫 후기를 작성해보세요!
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/stores/${review.store_id}`}
                  className="block bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {review.stores?.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {review.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex text-yellow-400">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i <= review.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          review.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {review.is_available ? '사용 가능' : '사용 불가'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 안내 */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-2">
            온누리상품권 사용 후기를 공유해주세요!
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            가맹점에서 실제로 상품권을 사용해보고 후기를 남겨주세요.
            다른 사용자들에게 큰 도움이 됩니다.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>- 상품권 사용 가능 여부</li>
            <li>- 최소 결제금액</li>
            <li>- 친절도, 분위기 등</li>
          </ul>
          <Link
            href="/submit-store"
            className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            찾는 가맹점이 없나요? 새 가맹점 제보하기 →
          </Link>
        </section>
      </div>
    </main>
  )
}
