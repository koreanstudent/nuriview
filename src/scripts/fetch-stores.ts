import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const API_KEY = process.env.DATA_API_KEY!
const API_URL = 'https://api.odcloud.kr/api/3060079/v1/uddi:7ffa42f8-01d1-4329-aa94-aefb67c53cf1'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface ApiStore {
  가맹점명: string
  '소속 시장명(또는 상점가)': string
  소재지: string
  취급품목: string
  '지류형 가맹 여부': string
  '디지털형 가맹 여부': string
}

interface ApiResponse {
  currentCount: number
  matchCount: number
  totalCount: number
  page: number
  perPage: number
  data: ApiStore[]
}

async function fetchPage(page: number, perPage: number): Promise<ApiResponse> {
  const url = `${API_URL}?page=${page}&perPage=${perPage}&returnType=JSON&serviceKey=${API_KEY}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function main() {
  console.log('온누리 가맹점 데이터 가져오기 시작...')

  const perPage = 1000
  let page = 1
  let totalFetched = 0
  let totalCount = 0

  do {
    console.log(`페이지 ${page} 요청 중...`)

    const result = await fetchPage(page, perPage)

    if (page === 1) {
      totalCount = result.totalCount
      console.log(`전체 데이터 수: ${totalCount}`)
    }

    const stores = result.data.map((item, index) => ({
      id: (page - 1) * perPage + index + 1,
      name: item.가맹점명 || '',
      market_name: item['소속 시장명(또는 상점가)'] || '',
      address: item.소재지 || '',
      road_address: '',
      category: item.취급품목 || '',
      phone: '',
      lat: 0,
      lng: 0,
      paper_available: item['지류형 가맹 여부'] === 'Y',
      card_available: item['디지털형 가맹 여부'] === 'Y',
      mobile_available: item['디지털형 가맹 여부'] === 'Y',
    }))

    if (stores.length > 0) {
      const { error } = await supabase
        .from('stores')
        .upsert(stores, { onConflict: 'id' })

      if (error) {
        console.error('Supabase 저장 오류:', error.message)
        throw error
      }

      totalFetched += stores.length
      console.log(`${totalFetched}/${totalCount} 저장 완료`)
    }

    page++
  } while (totalFetched < totalCount)

  console.log(`완료! 총 ${totalFetched}개 가맹점 저장됨`)
}

main().catch(console.error)
