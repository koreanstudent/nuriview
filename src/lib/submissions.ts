import { supabase } from './supabase'

const CONFIRM_THRESHOLD = 5

export async function getPendingSubmissions() {
  const { data, error } = await supabase
    .from('store_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getSubmissionConfirmations(submissionIds: number[], userId?: string) {
  if (submissionIds.length === 0) {
    return { confirmCounts: new Map<number, number>(), userConfirmed: new Set<number>() }
  }

  // 제보별 확인 수 조회
  const { data: counts } = await supabase
    .from('store_confirmations')
    .select('submission_id')
    .in('submission_id', submissionIds)

  const confirmCounts = new Map<number, number>()
  counts?.forEach(row => {
    confirmCounts.set(row.submission_id, (confirmCounts.get(row.submission_id) || 0) + 1)
  })

  // 유저가 확인한 제보 조회
  const userConfirmed = new Set<number>()
  if (userId) {
    const { data: userConfirms } = await supabase
      .from('store_confirmations')
      .select('submission_id')
      .eq('user_id', userId)
      .in('submission_id', submissionIds)

    userConfirms?.forEach(row => userConfirmed.add(row.submission_id))
  }

  return { confirmCounts, userConfirmed }
}

export async function confirmSubmission(userId: string, submissionId: number) {
  // 확인 추가
  const { error: insertError } = await supabase
    .from('store_confirmations')
    .insert({
      submission_id: submissionId,
      user_id: userId,
    })

  if (insertError) {
    return { error: insertError }
  }

  // 현재 확인 수 조회
  const { count } = await supabase
    .from('store_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('submission_id', submissionId)

  // 5명 이상이면 자동 승인
  if (count && count >= CONFIRM_THRESHOLD) {
    await autoApproveSubmission(submissionId)
    return { approved: true, error: null }
  }

  return { approved: false, error: null }
}

export async function unconfirmSubmission(userId: string, submissionId: number) {
  const { error } = await supabase
    .from('store_confirmations')
    .delete()
    .eq('user_id', userId)
    .eq('submission_id', submissionId)

  return { error }
}

async function autoApproveSubmission(submissionId: number) {
  // 제보 정보 조회
  const { data: submission } = await supabase
    .from('store_submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (!submission) return

  // stores 테이블에 추가 (제보의 좌표 사용)
  await supabase
    .from('stores')
    .insert({
      name: submission.name,
      address: submission.address,
      category: submission.category,
      lat: submission.lat || 0,
      lng: submission.lng || 0,
    })

  // 상태 업데이트
  await supabase
    .from('store_submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId)
}
