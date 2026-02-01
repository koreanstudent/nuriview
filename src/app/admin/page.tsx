'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { Shield, Check, X, Trash2, Loader2, Store, Clock } from 'lucide-react'

const ADMIN_EMAIL = 'hn12344@naver.com'

interface StoreSubmission {
  id: number
  user_id: string
  name: string
  address: string
  category: string | null
  note: string | null
  status: string
  created_at: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<StoreSubmission[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { user: currentUser } = await getCurrentUser()

      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }

      setUser(currentUser)
      fetchSubmissions()
    }
    init()
  }, [router])

  async function fetchSubmissions() {
    const { data, error } = await supabase
      .from('store_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  async function handleApprove(submission: StoreSubmission) {
    setProcessingId(submission.id)

    // stores 테이블에 추가
    const { error: insertError } = await supabase
      .from('stores')
      .insert({
        name: submission.name,
        address: submission.address,
        category: submission.category,
        lat: 0,
        lng: 0,
      })

    if (!insertError) {
      // 제보 상태 업데이트
      await supabase
        .from('store_submissions')
        .update({ status: 'approved' })
        .eq('id', submission.id)

      setSubmissions(submissions.map(s =>
        s.id === submission.id ? { ...s, status: 'approved' } : s
      ))
    }

    setProcessingId(null)
  }

  async function handleReject(id: number) {
    setProcessingId(id)

    await supabase
      .from('store_submissions')
      .update({ status: 'rejected' })
      .eq('id', id)

    setSubmissions(submissions.map(s =>
      s.id === id ? { ...s, status: 'rejected' } : s
    ))

    setProcessingId(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('삭제하시겠습니까?')) return

    setProcessingId(id)

    await supabase
      .from('store_submissions')
      .delete()
      .eq('id', id)

    setSubmissions(submissions.filter(s => s.id !== id))
    setProcessingId(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </main>
    )
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null
  }

  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">관리자</h1>
          {pendingCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded-full">
              {pendingCount}건 대기
            </span>
          )}
        </div>

        {/* 가맹점 제보 목록 */}
        <section className="bg-white rounded-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Store size={18} />
              가맹점 제보
            </h2>
          </div>

          {submissions.length === 0 ? (
            <p className="p-8 text-center text-gray-500">제보가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{submission.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : submission.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {submission.status === 'pending' ? '대기' :
                           submission.status === 'approved' ? '승인' : '거절'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{submission.address}</p>
                      {submission.category && (
                        <p className="text-sm text-gray-500">업종: {submission.category}</p>
                      )}
                      {submission.note && (
                        <p className="text-sm text-gray-500 mt-1">메모: {submission.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(submission.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {submission.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(submission)}
                            disabled={processingId === submission.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="승인"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(submission.id)}
                            disabled={processingId === submission.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="거절"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(submission.id)}
                        disabled={processingId === submission.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
