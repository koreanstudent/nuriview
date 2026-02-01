'use client'

import { useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createReview } from '@/lib/reviews'
import { uploadReviewImage } from '@/lib/storage'
import { Star, Loader2, Camera, X } from 'lucide-react'
import Link from 'next/link'

interface ReviewFormProps {
  storeId: number
  user: User | null
  onReviewAdded: () => void
}

export default function ReviewForm({ storeId, user, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [minAmount, setMinAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 10MB 제한
    if (file.size > 10 * 1024 * 1024) {
      setError('10MB 이하의 이미지만 업로드할 수 있습니다.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!content.trim()) {
      setError('리뷰 내용을 입력해주세요.')
      return
    }

    setError('')
    setLoading(true)

    // 이미지 업로드
    let imageUrl: string | null = null
    if (imageFile) {
      const { url, error: uploadError } = await uploadReviewImage(imageFile, user.id)
      if (uploadError) {
        setError(uploadError)
        setLoading(false)
        return
      }
      imageUrl = url
    }

    const { error } = await createReview(
      storeId,
      user.id,
      content.trim(),
      rating,
      isAvailable,
      minAmount ? parseInt(minAmount) : null,
      imageUrl
    )

    if (error) {
      setError('리뷰 작성에 실패했습니다.')
      setLoading(false)
      return
    }

    setContent('')
    setRating(5)
    setIsAvailable(true)
    setMinAmount('')
    removeImage()
    setLoading(false)
    onReviewAdded()
  }

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-3">로그인 후 리뷰를 작성할 수 있습니다.</p>
        <Link
          href={`/login?redirect=/stores/${storeId}`}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 별점 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">별점</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-yellow-400 hover:scale-110 transition-transform"
            >
              <Star
                size={28}
                fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600 self-center">{rating}점</span>
        </div>
      </div>

      {/* 리뷰 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 가맹점에서의 경험을 공유해주세요..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부 (선택)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="미리보기"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Camera size={18} />
            사진 추가
          </button>
        )}
      </div>

      {/* 사용 가능 여부 & 최소 금액 */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">현재 사용 가능</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">최소 결제금액</label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">원</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? '작성 중...' : '리뷰 작성'}
      </button>
    </form>
  )
}
