'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getPendingSubmissions, getSubmissionConfirmations, confirmSubmission, unconfirmSubmission } from '@/lib/submissions'
import { User } from '@supabase/supabase-js'
import { StoreSubmission } from '@/types'
import { Store, MapPin, Users, Check, Loader2, ArrowLeft, Plus, Clock } from 'lucide-react'

const CONFIRM_THRESHOLD = 5

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  return `${diffDay}일 전`
}

export default function SubmissionsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<StoreSubmission[]>([])
  const [confirmCounts, setConfirmCounts] = useState<Map<number, number>>(new Map())
  const [userConfirmed, setUserConfirmed] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { user: currentUser } = await getCurrentUser()
      setUser(currentUser)

      const { data } = await getPendingSubmissions()
      if (data) {
        setSubmissions(data)

        const submissionIds = data.map(s => s.id)
        const { confirmCounts, userConfirmed } = await getSubmissionConfirmations(
          submissionIds,
          currentUser?.id
        )
        setConfirmCounts(confirmCounts)
        setUserConfirmed(userConfirmed)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleConfirm = async (submissionId: number, submitterUserId: string) => {
    if (!user) return
    if (user.id === submitterUserId) return // 자기 제보는 확인 불가

    setConfirmingId(submissionId)
    const isConfirmed = userConfirmed.has(submissionId)

    if (isConfirmed) {
      await unconfirmSubmission(user.id, submissionId)
      setUserConfirmed(prev => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
      setConfirmCounts(prev => {
        const next = new Map(prev)
        next.set(submissionId, (next.get(submissionId) || 1) - 1)
        return next
      })
    } else {
      const { approved } = await confirmSubmission(user.id, submissionId)

      if (approved) {
        // 승인되면 목록에서 제거
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
      } else {
        setUserConfirmed(prev => new Set(prev).add(submissionId))
        setConfirmCounts(prev => {
          const next = new Map(prev)
          next.set(submissionId, (next.get(submissionId) || 0) + 1)
          return next
        })
      }
    }

    setConfirmingId(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/stores"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              <h1 className="text-xl font-bold text-gray-900">가맹점 확인 투표</h1>
            </div>
          </div>
          <Link
            href="/submit-store"
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            제보하기
          </Link>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            다른 사용자가 제보한 가맹점을 확인해주세요.<br />
            <strong>{CONFIRM_THRESHOLD}명</strong> 이상 확인되면 자동으로 가맹점에 등록됩니다.
          </p>
        </div>

        {/* 제보 목록 */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Store className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-4">확인 대기 중인 제보가 없습니다.</p>
            <Link
              href="/submit-store"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              새 가맹점 제보하기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
              const count = confirmCounts.get(submission.id) || 0
              const isConfirmed = userConfirmed.has(submission.id)
              const progress = Math.min((count / CONFIRM_THRESHOLD) * 100, 100)

              return (
                <div
                  key={submission.id}
                  className="bg-white rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{submission.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {submission.address}
                      </p>
                      {submission.category && (
                        <p className="text-xs text-gray-500 mt-1">업종: {submission.category}</p>
                      )}
                      {submission.note && (
                        <p className="text-xs text-gray-500 mt-1">메모: {submission.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimeAgo(submission.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleConfirm(submission.id, submission.user_id)}
                      disabled={!user || confirmingId === submission.id || user?.id === submission.user_id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        isConfirmed
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : user?.id === submission.user_id
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={!user ? '로그인 필요' : user.id === submission.user_id ? '본인 제보' : isConfirmed ? '확인 취소' : '확인하기'}
                    >
                      {confirmingId === submission.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      확인
                    </button>
                  </div>

                  {/* 진행 바 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{count}명 확인</span>
                      <span>{CONFIRM_THRESHOLD}명 필요</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!user && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-800 mb-2">
              로그인하면 가맹점 확인에 참여할 수 있습니다.
            </p>
            <Link
              href="/login?redirect=/submissions"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              로그인하기 →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
