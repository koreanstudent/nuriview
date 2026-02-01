'use client'

import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Store } from '@/types'
import KakaoMap from '@/components/KakaoMap'
import Link from 'next/link'
import { Navigation, Loader2, ChevronUp, ChevronDown, MapPin, Star } from 'lucide-react'

interface Bounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

// 두 지점 간 거리 계산 (km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

export default function MapPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 })
  const [locating, setLocating] = useState(false)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showNearbyList, setShowNearbyList] = useState(false)

  const fetchStoresInBounds = useCallback(async (bounds: Bounds) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .gt('lat', bounds.sw.lat)
      .lt('lat', bounds.ne.lat)
      .gt('lng', bounds.sw.lng)
      .lt('lng', bounds.ne.lng)
      .neq('lat', 0)
      .neq('lng', 0)
      .limit(500)

    if (!error && data) {
      setStores(data)
    }
    setLoading(false)
  }, [])

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 정보를 지원하지 않는 브라우저입니다.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCenter(loc)
        setMyLocation(loc)
        setShowNearbyList(true)
        setLocating(false)
      },
      (error) => {
        console.error('위치 정보 오류:', error)
        alert('위치 정보를 가져올 수 없습니다.')
        setLocating(false)
      },
      { enableHighAccuracy: true }
    )
  }

  // 가까운 가맹점 정렬 (최대 10개)
  const nearbyStores = useMemo(() => {
    if (!myLocation) return []
    return stores
      .map(store => ({
        ...store,
        distance: calculateDistance(myLocation.lat, myLocation.lng, store.lat, store.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10)
  }, [stores, myLocation])

  return (
    <main className="relative h-[calc(100vh-56px)]">
      {/* 지도 */}
      <KakaoMap
        stores={stores}
        center={center}
        level={5}
        onBoundsChange={fetchStoresInBounds}
        myLocation={myLocation}
      />

      {/* 로딩 표시 */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm text-gray-600">
          <Loader2 size={16} className="animate-spin" />
          가맹점 불러오는 중...
        </div>
      )}

      {/* 가맹점 수 */}
      <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
        <span className="font-medium text-gray-900">{stores.length}</span>
        <span className="text-gray-500">개 가맹점</span>
      </div>

      {/* 현재 위치 버튼 */}
      <button
        onClick={handleMyLocation}
        disabled={locating}
        className={`absolute ${showNearbyList ? 'bottom-72' : 'bottom-6'} right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50`}
        title="내 위치로 이동"
      >
        {locating ? (
          <Loader2 size={24} className="animate-spin text-blue-600" />
        ) : (
          <Navigation size={24} className={myLocation ? 'text-blue-600 fill-blue-600' : 'text-blue-600'} />
        )}
      </button>

      {/* 내 주변 가맹점 목록 */}
      {myLocation && (
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transition-transform ${showNearbyList ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
          {/* 헤더 */}
          <button
            onClick={() => setShowNearbyList(!showNearbyList)}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
          >
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" />
              <span className="font-medium text-gray-900">내 주변 가맹점</span>
              <span className="text-sm text-gray-500">({nearbyStores.length})</span>
            </div>
            {showNearbyList ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>

          {/* 목록 */}
          {showNearbyList && (
            <div className="max-h-56 overflow-y-auto">
              {nearbyStores.length === 0 ? (
                <p className="text-center text-gray-500 py-8">주변에 가맹점이 없습니다.</p>
              ) : (
                nearbyStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/stores/${store.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{store.name}</p>
                      <p className="text-sm text-gray-500 truncate">{store.road_address || store.address}</p>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-sm font-medium text-blue-600">{formatDistance(store.distance)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
