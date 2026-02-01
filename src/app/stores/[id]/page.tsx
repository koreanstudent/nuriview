'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store, Review } from '@/types'
import { onAuthStateChange } from '@/lib/auth'
import { getReviewsByStoreId } from '@/lib/reviews'
import ReviewForm from '@/components/ReviewForm'
import ReviewList from '@/components/ReviewList'
import KakaoMap from '@/components/KakaoMap'
import { User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  FileText,
  Star,
  MapPin,
  Store as StoreIcon,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Heart,
} from 'lucide-react'
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites'

type ReportStatus = 'open' | 'closed' | 'no_voucher'

interface Report {
  id: number
  store_id: number
  status: ReportStatus
  created_at: string
}

export default function StoreDetailPage() {
  const params = useParams()
  const storeId = params.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  const availablePercent =
    reviews.length > 0
      ? Math.round(
          (reviews.filter((r) => r.is_available).length / reviews.length) * 100
        )
      : null

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setUser(user)
      // 즐겨찾기 상태 확인
      if (user) {
        const { isFavorite: fav } = await isFavorite(user.id, parseInt(storeId))
        setFavorited(fav)
      } else {
        setFavorited(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [storeId])

  const handleToggleFavorite = async () => {
    if (!user) return
    setFavLoading(true)

    if (favorited) {
      await removeFavorite(user.id, parseInt(storeId))
      setFavorited(false)
    } else {
      await addFavorite(user.id, parseInt(storeId))
      setFavorited(true)
    }

    setFavLoading(false)
  }

  const fetchData = async () => {
    setLoading(true)

    const [storeRes, reviewsRes, reportsRes] = await Promise.all([
      supabase.from('stores').select('*').eq('id', storeId).single(),
      getReviewsByStoreId(parseInt(storeId)),
      supabase
        .from('reports')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    if (storeRes.data) setStore(storeRes.data)
    if (reviewsRes.data) setReviews(reviewsRes.data)
    if (reportsRes.data) setReports(reportsRes.data)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [storeId])

  const handleReport = async (status: ReportStatus) => {
    setSubmitting(true)
    const { data, error } = await supabase
      .from('reports')
      .insert({ store_id: parseInt(storeId), status })
      .select()
      .single()

    if (!error && data) {
      setReports([data, ...reports])
    }
    setSubmitting(false)
  }

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 'open':
        return { label: '영업중', color: 'text-green-600', icon: CheckCircle }
      case 'closed':
        return { label: '폐업', color: 'text-red-600', icon: XCircle }
      case 'no_voucher':
        return { label: '상품권 안받음', color: 'text-yellow-600', icon: AlertCircle }
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-20 text-gray-500">
          로딩 중...
        </div>
      </main>
    )
  }

  if (!store) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">가맹점을 찾을 수 없습니다.</p>
          <Link href="/stores" className="text-blue-600 hover:text-blue-700">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/stores"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">가맹점 정보</h1>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
            {user && (
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className={`p-2 rounded-lg transition-colors ${
                  favorited
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                }`}
                title={favorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <Heart size={20} fill={favorited ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span>{store.road_address || store.address}</span>
            </div>
            {store.market_name && (
              <div className="flex items-center gap-2">
                <StoreIcon size={16} className="text-gray-400" />
                <span>{store.market_name}</span>
              </div>
            )}
            {store.category && (
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-gray-400" />
                <span>{store.category}</span>
              </div>
            )}
          </div>

          {/* 결제수단 */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {store.paper_available && (
              <span className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg">
                <FileText size={14} />
                지류
              </span>
            )}
            {store.card_available && (
              <span className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                <CreditCard size={14} />
                카드
              </span>
            )}
            {store.mobile_available && (
              <span className="flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                <Smartphone size={14} />
                모바일
              </span>
            )}
          </div>

          {/* 평균 별점 & 사용 가능 비율 */}
          {reviews.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i <= Math.round(averageRating) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({reviews.length}개 리뷰)
                </span>
              </div>

              {availablePercent !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp size={16} className="text-blue-500" />
                  <span className="text-gray-600">
                    최근 리뷰 <span className="font-semibold text-blue-600">{availablePercent}%</span>가 사용 가능
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 미니 지도 */}
        {store.lat !== 0 && store.lng !== 0 && (
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3">위치</h3>
            <div className="h-48 rounded-lg overflow-hidden">
              <KakaoMap
                stores={[store]}
                center={{ lat: store.lat, lng: store.lng }}
                level={3}
                singleMarker
              />
            </div>
          </div>
        )}

        {/* 유저 제보 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">현재 상태 제보하기</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleReport('open')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              영업중
            </button>
            <button
              onClick={() => handleReport('closed')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} />
              폐업
            </button>
            <button
              onClick={() => handleReport('no_voucher')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition-colors disabled:opacity-50"
            >
              <AlertCircle size={16} />
              안받음
            </button>
          </div>

          {/* 최근 제보 */}
          {reports.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">최근 제보</p>
              <div className="space-y-2">
                {reports.map((report) => {
                  const status = getStatusLabel(report.status)
                  const Icon = status.icon
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className={`flex items-center gap-1.5 ${status.color}`}>
                        <Icon size={14} />
                        {status.label}
                      </div>
                      <span className="text-gray-400 text-xs">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 리뷰 작성 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">리뷰 작성</h3>
          <ReviewForm
            storeId={parseInt(storeId)}
            user={user}
            onReviewAdded={fetchData}
          />
        </div>

        {/* 리뷰 목록 */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            리뷰 {reviews.length > 0 && `(${reviews.length})`}
          </h3>
          <ReviewList
            reviews={reviews}
            user={user}
            onReviewDeleted={fetchData}
          />
        </div>
      </div>
    </main>
  )
}
