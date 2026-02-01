import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const STORE_API_KEY = process.env.STORE_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 상가 API 응답 타입
interface StoreApiResponse {
  header: {
    resultCode: string
    resultMsg: string
  }
  body: {
    items: StoreItem[]
    totalCount: number
  }
}

interface StoreItem {
  bizesNm: string      // 상호명
  lnoAdr: string       // 지번주소
  rdnmAdr: string      // 도로명주소
  lon: string          // 경도 (x)
  lat: string          // 위도 (y)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 상호명 정규화 (비교용)
function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, '')           // 공백 제거
    .replace(/[^\w가-힣]/g, '')    // 특수문자 제거
    .toLowerCase()
}

// 상가 API로 상호명 검색
async function searchStoreByName(storeName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInUpjong?serviceKey=${STORE_API_KEY}&pageNo=1&numOfRows=100&key=${encodeURIComponent(storeName)}&type=json`

    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const text = await response.text()

    // 빈 응답 또는 에러 체크
    if (!text || text.includes('SERVICE_KEY') || text.includes('ERROR')) {
      return null
    }

    let data: StoreApiResponse
    try {
      data = JSON.parse(text)
    } catch {
      return null
    }

    if (!data.body?.items || data.body.items.length === 0) {
      return null
    }

    const normalizedSearch = normalizeName(storeName)

    // 정확히 일치하는 상호 찾기
    for (const item of data.body.items) {
      const normalizedItem = normalizeName(item.bizesNm)

      // 완전 일치 또는 포함 관계
      if (normalizedItem === normalizedSearch ||
          normalizedItem.includes(normalizedSearch) ||
          normalizedSearch.includes(normalizedItem)) {

        if (item.lon && item.lat) {
          return {
            lat: parseFloat(item.lat),  // y = 위도
            lng: parseFloat(item.lon),  // x = 경도
          }
        }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

async function main() {
  console.log('상가 API 좌표 매칭 시작...')

  let processed = 0
  let matched = 0
  let failed = 0
  let offset = 0
  const batchSize = 1000

  while (true) {
    // lat, lng가 0인 가맹점 조회
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, address')
      .or('lat.eq.0,lng.eq.0')
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('조회 오류:', error.message)
      break
    }

    if (!stores || stores.length === 0) {
      console.log('매칭할 가맹점이 없습니다.')
      break
    }

    console.log(`\n${stores.length}개 가맹점 처리 중... (offset: ${offset})`)

    for (const store of stores) {
      if (!store.name) {
        processed++
        failed++
        continue
      }

      const coords = await searchStoreByName(store.name)

      if (coords && coords.lat !== 0 && coords.lng !== 0) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', store.id)

        if (!updateError) {
          matched++
        } else {
          failed++
        }
      } else {
        failed++
      }

      processed++

      if (processed % 100 === 0) {
        const matchRate = ((matched / processed) * 100).toFixed(1)
        console.log(`진행: ${processed}개 (매칭: ${matched}, 실패: ${failed}, 매칭률: ${matchRate}%)`)
      }

      // API 호출 제한 방지
      await sleep(100)
    }

    // 다음 배치
    if (stores.length < batchSize) {
      break
    }

    offset += batchSize
  }

  // 최종 통계
  const finalMatchRate = processed > 0 ? ((matched / processed) * 100).toFixed(1) : '0'

  console.log('\n========== 완료 ==========')
  console.log(`총 처리: ${processed}개`)
  console.log(`매칭 성공: ${matched}개`)
  console.log(`매칭 실패: ${failed}개`)
  console.log(`매칭률: ${finalMatchRate}%`)
  console.log('===========================')
}

main().catch(console.error)
