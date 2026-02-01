import { supabase } from './supabase'

export async function createReview(
  storeId: number,
  userId: string,
  content: string,
  rating: number,
  isAvailable: boolean,
  minAmount: number | null,
  imageUrl: string | null = null
) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      store_id: storeId,
      user_id: userId,
      content,
      rating,
      is_available: isAvailable,
      min_amount: minAmount || 0,
      image_url: imageUrl,
    })
    .select()
    .single()

  return { data, error }
}

export async function getReviewsByStoreId(storeId: number) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function deleteReview(reviewId: number) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  return { error }
}
