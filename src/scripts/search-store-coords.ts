import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface KakaoKeywordResponse {
  documents: {
    place_name: string
    address_name: string
    road_address_name: string
    x: string  // 경도 (lng)
    y: string  // 위도 (lat)
  }[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 상호명 정규화 (비교용)
function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣]/g, '')
    .toLowerCase()
}

// 카카오 장소 검색
async function searchPlace(storeName: string, marketName: string, region: string): Promise<{ lat: number; lng: number; address: string } | null> {
  // 검색 우선순위: 1) 가맹점명+시장명  2) 가맹점명+지역  3) 가맹점명만
  const queries = [
    marketName ? `${storeName} ${marketName}` : null,
    region ? `${storeName} ${region}` : null,
    storeName,
  ].filter(Boolean) as string[]

  for (const query of queries) {
    const result = await searchWithQuery(query, storeName)
    if (result) return result
    await sleep(50)
  }

  return null
}

async function searchWithQuery(query: string, storeName: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data: KakaoKeywordResponse = await response.json()

    if (!data.documents || data.documents.length === 0) {
      return null
    }

    const normalizedStore = normalizeName(storeName)

    // 상호명 매칭
    for (const place of data.documents) {
      const normalizedPlace = normalizeName(place.place_name)

      // 완전 일치 또는 포함
      if (normalizedPlace === normalizedStore ||
          normalizedPlace.includes(normalizedStore) ||
          normalizedStore.includes(normalizedPlace)) {
        return {
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          address: place.road_address_name || place.address_name,
        }
      }
    }

    return null
  } catch (error) {
    return null
  }
}


async function main() {
  console.log('카카오 장소 검색으로 좌표 매칭 시작...')
  console.log('(못 찾은 가맹점은 삭제됩니다)\n')

  let processed = 0
  let found = 0
  let deleted = 0
  let offset = 0
  const batchSize = 1000

  while (true) {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, address, market_name')
      .or('lat.eq.0,lng.eq.0')
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('조회 오류:', error.message)
      break
    }

    if (!stores || stores.length === 0) {
      console.log('처리할 가맹점이 없습니다.')
      break
    }

    console.log(`${stores.length}개 가맹점 처리 중... (offset: ${offset})`)

    for (const store of stores) {
      if (!store.name) {
        // 이름 없으면 삭제
        await supabase.from('stores').delete().eq('id', store.id)
        deleted++
        processed++
        continue
      }

      const result = await searchPlace(store.name, store.market_name || '', store.address || '')

      if (result) {
        // 좌표 찾음 → 업데이트
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            lat: result.lat,
            lng: result.lng,
            road_address: result.address || store.address,
          })
          .eq('id', store.id)

        if (!updateError) {
          found++
        }
      } else {
        // 못 찾음 → 삭제
        await supabase.from('stores').delete().eq('id', store.id)
        deleted++
      }

      processed++

      if (processed % 100 === 0) {
        const foundRate = ((found / processed) * 100).toFixed(1)
        console.log(`진행: ${processed}개 (찾음: ${found}, 삭제: ${deleted}, 매칭률: ${foundRate}%)`)
      }

      await sleep(100)
    }

    if (stores.length < batchSize) {
      break
    }

    offset += batchSize
  }

  const finalRate = processed > 0 ? ((found / processed) * 100).toFixed(1) : '0'

  console.log('\n========== 완료 ==========')
  console.log(`총 처리: ${processed}개`)
  console.log(`좌표 찾음: ${found}개`)
  console.log(`삭제됨: ${deleted}개`)
  console.log(`매칭률: ${finalRate}%`)
  console.log('===========================')
}

main().catch(console.error)
