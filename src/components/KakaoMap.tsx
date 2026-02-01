'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Store } from '@/types'

interface Bounds {
  sw: { lat: number; lng: number }
  ne: { lat: number; lng: number }
}

interface KakaoMapProps {
  stores: Store[]
  center?: { lat: number; lng: number }
  level?: number
  onBoundsChange?: (bounds: Bounds) => void
  onMarkerClick?: (store: Store) => void
  singleMarker?: boolean
  className?: string
  myLocation?: { lat: number; lng: number } | null
}

export default function KakaoMap({
  stores,
  center = { lat: 37.5665, lng: 126.978 }, // 서울 시청
  level = 5,
  onBoundsChange,
  onMarkerClick,
  singleMarker = false,
  className = '',
  myLocation = null,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [clusterer, setClusterer] = useState<kakao.maps.MarkerClusterer | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null)
  const myLocationMarkerRef = useRef<kakao.maps.Marker | null>(null)

  // 이미 로드된 스크립트 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && window.kakao && window.kakao.maps && window.kakao.maps.MarkerClusterer) {
      setScriptLoaded(true)
    }
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) return

    const initMap = () => {
      const mapInstance = new window.kakao.maps.Map(mapRef.current!, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      })

      setMap(mapInstance)

      // 클러스터러 생성 (단일 마커 모드가 아닐 때만)
      if (!singleMarker) {
        const clustererInstance = new window.kakao.maps.MarkerClusterer({
          map: mapInstance,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: false,
          styles: [
            {
              width: '50px',
              height: '50px',
              background: 'rgba(59, 130, 246, 0.8)',
              borderRadius: '25px',
              color: '#fff',
              textAlign: 'center',
              lineHeight: '50px',
              fontSize: '14px',
              fontWeight: 'bold',
            },
          ],
        })
        setClusterer(clustererInstance)
      }

      // 지도 이동 이벤트
      if (onBoundsChange) {
        window.kakao.maps.event.addListener(mapInstance, 'idle', () => {
          const bounds = mapInstance.getBounds()
          const sw = bounds.getSouthWest()
          const ne = bounds.getNorthEast()
          onBoundsChange({
            sw: { lat: sw.getLat(), lng: sw.getLng() },
            ne: { lat: ne.getLat(), lng: ne.getLng() },
          })
        })
      }
    }

    // kakao.maps.load가 이미 완료됐는지 확인 (클러스터러 포함)
    if (window.kakao.maps.Map && window.kakao.maps.MarkerClusterer) {
      initMap()
    } else {
      window.kakao.maps.load(initMap)
    }
  }, [scriptLoaded, singleMarker])

  // 마커 업데이트
  useEffect(() => {
    if (!map) return

    // 기존 인포윈도우 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }

    if (singleMarker && stores.length > 0) {
      // 단일 마커 모드
      const store = stores[0]
      const position = new window.kakao.maps.LatLng(store.lat, store.lng)
      const marker = new window.kakao.maps.Marker({ position, map })
      map.setCenter(position)

      return () => marker.setMap(null)
    }

    if (!clusterer) return

    // 클러스터러 초기화
    clusterer.clear()

    const markers = stores
      .filter((store) => store.lat && store.lng && store.lat !== 0 && store.lng !== 0)
      .map((store) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(store.lat, store.lng),
        })

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close()
          }

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 200px; font-size: 14px;">
                <strong style="font-size: 15px; color: #1f2937;">${store.name}</strong>
                <p style="margin: 6px 0 8px; color: #6b7280; font-size: 13px;">
                  ${store.road_address || store.address}
                </p>
                <a href="/stores/${store.id}"
                   style="color: #2563eb; text-decoration: none; font-size: 13px;">
                  상세보기 →
                </a>
              </div>
            `,
          })

          infoWindow.open(map, marker)
          infoWindowRef.current = infoWindow

          if (onMarkerClick) {
            onMarkerClick(store)
          }
        })

        return marker
      })

    clusterer.addMarkers(markers)
  }, [map, clusterer, stores, singleMarker, onMarkerClick])

  // 중심 이동
  useEffect(() => {
    if (map && center) {
      map.panTo(new window.kakao.maps.LatLng(center.lat, center.lng))
    }
  }, [map, center.lat, center.lng])

  // 내 위치 마커
  useEffect(() => {
    if (!map || !myLocation) return

    // 기존 마커 제거
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.setMap(null)
    }

    // 내 위치 마커 생성 (파란색 원)
    const markerContent = `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `

    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(myLocation.lat, myLocation.lng),
      content: markerContent,
      yAnchor: 0.5,
      xAnchor: 0.5,
    })

    customOverlay.setMap(map)

    return () => {
      customOverlay.setMap(null)
    }
  }, [map, myLocation])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`}
        strategy="afterInteractive"
        onLoad={() => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              setScriptLoaded(true)
            })
          }
        }}
        onError={(e) => {
          console.error('Kakao script error:', e)
        }}
      />
      <div ref={mapRef} className="w-full h-full bg-gray-100" />
      {!map && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-500">지도 로딩 중...</div>
        </div>
      )}
    </div>
  )
}
