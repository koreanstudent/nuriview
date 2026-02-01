'use client'

import Link from 'next/link'
import { Store } from '@/types'
import { CreditCard, Smartphone, FileText, Star, MessageSquare, AlertTriangle } from 'lucide-react'

interface StoreCardProps {
  store: Store
  averageRating?: number
  reviewCount?: number
}

export default function StoreCard({ store, averageRating, reviewCount }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.id}`}>
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{store.name}</h2>
              {store.closure_reports >= 3 && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                  <AlertTriangle size={10} />
                  폐업의심
                </span>
              )}
              {store.closure_reports > 0 && store.closure_reports < 3 && (
                <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">
                  <AlertTriangle size={10} />
                  신고{store.closure_reports}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {store.road_address || store.address}
            </p>
            {store.market_name && (
              <p className="text-xs text-gray-500 mt-1">{store.market_name}</p>
            )}
            {store.category && (
              <p className="text-xs text-gray-400 mt-1">{store.category}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {averageRating !== undefined && averageRating > 0 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              </div>
            )}
            {reviewCount !== undefined && reviewCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <MessageSquare size={12} />
                <span className="text-xs">후기 {reviewCount}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {store.paper_available && (
            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              <FileText size={12} />
              지류
            </span>
          )}
          {store.card_available && (
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              <CreditCard size={12} />
              카드
            </span>
          )}
          {store.mobile_available && (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              <Smartphone size={12} />
              모바일
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
