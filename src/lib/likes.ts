import { supabase } from './supabase'

export async function likeReview(userId: string, reviewId: number) {
  const { error } = await supabase
    .from('review_likes')
    .insert({ user_id: userId, review_id: reviewId })

  return { error }
}

export async function unlikeReview(userId: string, reviewId: number) {
  const { error } = await supabase
    .from('review_likes')
    .delete()
    .eq('user_id', userId)
    .eq('review_id', reviewId)

  return { error }
}

export async function getReviewLikes(reviewIds: number[], userId?: string) {
  // 각 리뷰의 좋아요 수
  const { data: counts } = await supabase
    .from('review_likes')
    .select('review_id')
    .in('review_id', reviewIds)

  const likeCounts = new Map<number, number>()
  counts?.forEach(item => {
    likeCounts.set(item.review_id, (likeCounts.get(item.review_id) || 0) + 1)
  })

  // 사용자가 좋아요한 리뷰 목록
  let userLikes = new Set<number>()
  if (userId) {
    const { data: likes } = await supabase
      .from('review_likes')
      .select('review_id')
      .eq('user_id', userId)
      .in('review_id', reviewIds)

    likes?.forEach(item => userLikes.add(item.review_id))
  }

  return { likeCounts, userLikes }
}
