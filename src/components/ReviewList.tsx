'use client'

import { User } from '@supabase/supabase-js'
import { Review } from '@/types'
import { deleteReview } from '@/lib/reviews'
import { likeReview, unlikeReview, getReviewLikes } from '@/lib/likes'
import { Star, CheckCircle, XCircle, Trash2, ThumbsUp } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ReviewListProps {
  reviews: Review[]
  user: User | null
  onReviewDeleted: () => void
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function maskUserId(userId: string): string {
  return `사용자 ${userId.slice(0, 4)}`
}

export default function ReviewList({ reviews, user, onReviewDeleted }: ReviewListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [likeCounts, setLikeCounts] = useState<Map<number, number>>(new Map())
  const [userLikes, setUserLikes] = useState<Set<number>>(new Set())
  const [likingId, setLikingId] = useState<number | null>(null)

  useEffect(() => {
    if (reviews.length === 0) return

    const reviewIds = reviews.map(r => r.id)
    getReviewLikes(reviewIds, user?.id).then(({ likeCounts, userLikes }) => {
      setLikeCounts(likeCounts)
      setUserLikes(userLikes)
    })
  }, [reviews, user?.id])

  const handleDelete = async (reviewId: number) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return

    setDeletingId(reviewId)
    const { error } = await deleteReview(reviewId)

    if (!error) {
      onReviewDeleted()
    }
    setDeletingId(null)
  }

  const handleLike = async (reviewId: number) => {
    if (!user) return

    setLikingId(reviewId)
    const isLiked = userLikes.has(reviewId)

    if (isLiked) {
      await unlikeReview(user.id, reviewId)
      setUserLikes(prev => {
        const next = new Set(prev)
        next.delete(reviewId)
        return next
      })
      setLikeCounts(prev => {
        const next = new Map(prev)
        next.set(reviewId, (next.get(reviewId) || 1) - 1)
        return next
      })
    } else {
      await likeReview(user.id, reviewId)
      setUserLikes(prev => new Set(prev).add(reviewId))
      setLikeCounts(prev => {
        const next = new Map(prev)
        next.set(reviewId, (next.get(reviewId) || 0) + 1)
        return next
      })
    }

    setLikingId(null)
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const likeCount = likeCounts.get(review.id) || 0
        const isLiked = userLikes.has(review.id)

        return (
          <div
            key={review.id}
            className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {/* 별점 & 시간 */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(review.created_at)}
                  </span>
                </div>

                {/* 작성자 */}
                <p className="text-xs text-gray-500 mb-2">
                  {maskUserId(review.user_id)}
                </p>

                {/* 내용 */}
                <p className="text-sm text-gray-700">{review.content}</p>

                {/* 이미지 */}
                {review.image_url && (
                  <div className="mt-2">
                    <img
                      src={review.image_url}
                      alt="리뷰 이미지"
                      className="w-40 h-40 object-cover rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(review.image_url!, '_blank')}
                    />
                  </div>
                )}

                {/* 뱃지 & 좋아요 */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-2">
                    {review.is_available ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle size={12} />
                        사용 가능
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        <XCircle size={12} />
                        사용 불가
                      </span>
                    )}
                    {review.min_amount > 0 && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        최소 {review.min_amount.toLocaleString()}원
                      </span>
                    )}
                  </div>

                  {/* 좋아요 버튼 */}
                  <button
                    onClick={() => handleLike(review.id)}
                    disabled={!user || likingId === review.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      isLiked
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    } disabled:opacity-50`}
                    title={user ? (isLiked ? '좋아요 취소' : '좋아요') : '로그인 필요'}
                  >
                    <ThumbsUp size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                  </button>
                </div>
              </div>

              {/* 삭제 버튼 */}
              {user && user.id === review.user_id && (
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
