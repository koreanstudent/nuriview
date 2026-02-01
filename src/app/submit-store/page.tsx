'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { Store, MapPin, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function SubmitStorePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('가맹점명을 입력해주세요.')
      return
    }
    if (!address.trim()) {
      setError('주소를 입력해주세요.')
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
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="예: 서울시 종로구 종로 1길 10"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
  )
}
