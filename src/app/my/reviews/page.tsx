'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { Star, MapPin, Trash2, Loader2, MessageSquare } from 'lucide-react'

interface MyReview {
  id: number
  content: string
  rating: number
  is_available: boolean
  min_amount: number
  image_url: string | null
  created_at: string
  stores: {
    id: number
    name: string
    address: string
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function MyReviewsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        router.push('/login?redirect=/my/reviews')
        return
      }
      setUser(currentUser)
      fetchMyReviews(currentUser.id)
    }
    init()
  }, [router])

  async function fetchMyReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, content, rating, is_available, min_amount, image_url, created_at, stores(id, name, address)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setReviews(data as unknown as MyReview[])
    }
    setLoading(false)
  }

  async function handleDelete(reviewId: number) {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return

    setDeletingId(reviewId)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (!error) {
      setReviews(reviews.filter(r => r.id !== reviewId))
    }
    setDeletingId(null)
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
          <MessageSquare className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">내가 쓴 후기</h1>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">작성한 후기가 없습니다.</p>
            <Link
              href="/stores"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              가맹점 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-100">
                {/* 가맹점 정보 */}
                <Link
                  href={`/stores/${review.stores.id}`}
                  className="flex items-start gap-2 mb-3 hover:text-blue-600 transition-colors"
                >
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{review.stores.name}</p>
                    <p className="text-sm text-gray-500">{review.stores.address}</p>
                  </div>
                </Link>

                {/* 별점 & 날짜 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
                </div>

                {/* 내용 */}
                <p className="text-sm text-gray-700 mb-2">{review.content}</p>

                {/* 이미지 */}
                {review.image_url && (
                  <img
                    src={review.image_url}
                    alt="리뷰 이미지"
                    className="w-32 h-32 object-cover rounded-lg mb-2"
                  />
                )}

                {/* 뱃지 & 삭제 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      review.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {review.is_available ? '사용 가능' : '사용 불가'}
                    </span>
                    {review.min_amount > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        최소 {review.min_amount.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingId === review.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
