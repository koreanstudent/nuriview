import { supabase } from './supabase'

export async function addFavorite(userId: string, storeId: number) {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, store_id: storeId })

  return { error }
}

export async function removeFavorite(userId: string, storeId: number) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('store_id', storeId)

  return { error }
}

export async function isFavorite(userId: string, storeId: number) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .single()

  return { isFavorite: !error && !!data, error }
}

export async function getFavoritesByUserId(userId: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('store_id, created_at, stores(id, name, address, road_address)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}
