export interface Store {
  id: number
  name: string
  address: string
  road_address: string
  lat: number
  lng: number
  phone: string
  market_name: string
  category: string
  card_available: boolean
  mobile_available: boolean
  paper_available: boolean
}

export interface Review {
  id: number
  store_id: number
  user_id: string
  content: string
  rating: number
  is_available: boolean
  voucher_type: 'paper' | 'card' | 'mobile' | null
  min_amount: number
  image_url: string | null
  created_at: string
}
