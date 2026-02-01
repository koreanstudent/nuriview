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

export interface StoreSubmission {
  id: number
  user_id: string
  name: string
  address: string
  category: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  confirm_count: number
  created_at: string
}

export interface StoreConfirmation {
  id: number
  submission_id: number
  user_id: string
  created_at: string
}
