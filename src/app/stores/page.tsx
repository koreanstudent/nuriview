'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Store } from '@/types'
import StoreCard from '@/components/StoreCard'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const REGIONS = [
  '전체', '서울', '경기', '부산', '인천', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
]

const PER_PAGE = 20

interface StoreWithReviews extends Store {
  reviewCount?: number
  avgRating?: number
  availablePercent?: number
}

function StoresList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [stores, setStores] = useState<StoreWithReviews[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const search = searchParams.get('search') || ''
  const region = searchParams.get('region') || '전체'
  const paper = searchParams.get('paper') === 'true'
  const card = searchParams.get('card') === 'true'
  const mobile = searchParams.get('mobile') === 'true'
  const sort = searchParams.get('sort') || 'reviews'
  const page = parseInt(searchParams.get('page') || '1')

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === '전체' || value === 'false') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    if (updates.page === undefined && Object.keys(updates).some(k => k !== 'page')) {
      params.delete('page')
    }
    router.push(`/stores?${params.toString()}`)
  }

  useEffect(() => {
    async function fetchStores() {
      setLoading(true)

      let query = supabase
        .from('stores')
        .select('*', { count: 'exact' })

      if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`)
      }

      if (region && region !== '전체') {
        query = query.ilike('address', `${region}%`)
      }

      if (paper) query = query.eq('paper_available', true)
      if (card) query = query.eq('card_available', true)
      if (mobile) query = query.eq('mobile_available', true)

      if (sort === 'name') {
        query = query.order('name', { ascending: true })
      } else {
        query = query.order('id', { ascending: false })
      }

      const from = (page - 1) * PER_PAGE
      const to = from + PER_PAGE - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (!error && data) {
        const storeIds = data.map(s => s.id)
        const { data: reviewStats } = await supabase
          .from('reviews')
          .select('store_id, rating, is_available')
          .in('store_id', storeIds)

        const statsMap = new Map<number, { count: number; total: number; available: number }>()
        if (reviewStats) {
          reviewStats.forEach(r => {
            const existing = statsMap.get(r.store_id) || { count: 0, total: 0, available: 0 }
            statsMap.set(r.store_id, {
              count: existing.count + 1,
              total: existing.total + r.rating,
              available: existing.available + (r.is_available ? 1 : 0)
            })
          })
        }

        let storesWithReviews: StoreWithReviews[] = data.map(store => {
          const stats = statsMap.get(store.id)
          return {
            ...store,
            reviewCount: stats?.count || 0,
            avgRating: stats ? stats.total / stats.count : 0,
            availablePercent: stats && stats.count > 0
              ? Math.round((stats.available / stats.count) * 100)
              : undefined
          }
        })

        if (sort === 'reviews') {
          storesWithReviews = storesWithReviews.sort((a, b) =>
            (b.reviewCount || 0) - (a.reviewCount || 0)
          )
        }

        setStores(storesWithReviews)
        setTotalCount(count || 0)
      }
      setLoading(false)
    }

    fetchStores()
  }, [search, region, paper, card, mobile, sort, page])

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  return (
    <>
      {/* 검색창 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="가맹점명, 주소 검색..."
          defaultValue={search}
          onChange={(e) => {
            const value = e.target.value
            if (value.length === 0 || value.length >= 2) {
              updateParams({ search: value || null })
            }
          }}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">지역</label>
            <select
              value={region}
              onChange={(e) => updateParams({ region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">정렬</label>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reviews">후기 많은순</option>
              <option value="name">이름순</option>
              <option value="latest">최신순</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paper}
              onChange={(e) => updateParams({ paper: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">지류</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={card}
              onChange={(e) => updateParams({ card: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">카드</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mobile}
              onChange={(e) => updateParams({ mobile: e.target.checked ? 'true' : null })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">모바일</span>
          </label>
        </div>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        총 {totalCount.toLocaleString()}개 가맹점
      </p>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">로딩 중...</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="grid gap-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              reviewCount={store.reviewCount}
              averageRating={store.avgRating}
              availablePercent={store.availablePercent}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => updateParams({ page: String(page - 1) })}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            {page} / {totalPages.toLocaleString()}
          </span>
          <button
            onClick={() => updateParams({ page: String(page + 1) })}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </>
  )
}

export default function StoresPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">가맹점 후기</h1>
        <Suspense fallback={<div className="text-center py-20 text-gray-500">로딩 중...</div>}>
          <StoresList />
        </Suspense>
      </div>
    </main>
  )
}
