'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { Store, MapPin, Loader2, CheckCircle, ArrowLeft, Search } from 'lucide-react'

export default function SubmitStorePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [scriptsLoaded, setScriptsLoaded] = useState({ postcode: false, kakao: false })

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function init() {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        router.push('/login?redirect=/submit-store')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    init()
  }, [router])

  const isScriptsReady = scriptsLoaded.postcode && scriptsLoaded.kakao

  const handleAddressSearch = () => {
    if (!isScriptsReady) return

    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress
        setAddress(addr)

        // 좌표 검색
        window.kakao.maps.load(() => {
          const geocoder = new window.kakao.maps.services.Geocoder()
          geocoder.addressSearch(addr, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK && result[0]) {
              setLng(parseFloat(result[0].x))
              setLat(parseFloat(result[0].y))
            }
          })
        })
      },
    }).open()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('가맹점명을 입력해주세요.')
      return
    }
    if (!address.trim()) {
      setError('주소를 검색해주세요.')
      return
    }

    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase
      .from('store_submissions')
      .insert({
        user_id: user?.id,
        name: name.trim(),
        address: address.trim(),
        category: category.trim() || null,
        note: note.trim() || null,
        status: 'pending',
        lat,
        lng,
      })

    if (insertError) {
      setError('제보 등록에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg p-8 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">제보 완료</h2>
            <p className="text-gray-600 mb-6">
              가맹점 정보가 등록되었습니다.<br />
              <strong>5명</strong> 이상 확인되면 자동으로 가맹점에 추가됩니다.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSuccess(false)
                  setName('')
                  setAddress('')
                  setLat(0)
                  setLng(0)
                  setCategory('')
                  setNote('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                추가 제보하기
              </button>
              <Link
                href="/submissions"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인 투표하기
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, postcode: true }))}
      />
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, kakao: true }))}
      />
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/stores"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Store className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">새 가맹점 제보</h1>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-6">
              온누리상품권을 사용할 수 있는 가맹점을 발견하셨나요?<br />
              정보를 제보해주시면 검토 후 등록됩니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가맹점명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동 식당"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={address}
                      readOnly
                      placeholder={isScriptsReady ? "주소 검색을 클릭하세요" : "로딩 중..."}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 cursor-pointer focus:outline-none"
                      onClick={() => isScriptsReady && handleAddressSearch()}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={!isScriptsReady}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isScriptsReady ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Search size={18} />
                    )}
                    검색
                  </button>
                </div>
                {lat !== 0 && lng !== 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    좌표 확인됨
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업종/카테고리
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 한식, 카페, 미용실 등"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 정보
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="상품권 종류(지류, 카드, 모바일), 영업시간 등 알려주세요"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                {submitting ? '등록 중...' : '제보하기'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
