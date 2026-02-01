import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface KakaoAddressResponse {
  documents: {
    x: string // 경도 (lng)
    y: string // 위도 (lat)
  }[]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_API_KEY}`,
      },
    })

    if (!response.ok) {
      console.error(`API 오류: ${response.status}`)
      return null
    }

    const data: KakaoAddressResponse = await response.json()

    if (data.documents.length === 0) {
      return null
    }

    return {
      lat: parseFloat(data.documents[0].y),
      lng: parseFloat(data.documents[0].x),
    }
  } catch (error) {
    console.error(`주소 변환 실패: ${address}`, error)
    return null
  }
}

async function main() {
  console.log('좌표 변환 시작...')

  const failedAddresses: string[] = []
  let processed = 0
  let success = 0
  let offset = 0
  const batchSize = 1000

  while (true) {
    // lat, lng가 0인 가맹점 조회
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, address')
      .or('lat.eq.0,lng.eq.0')
      .range(offset, offset + batchSize - 1)

    if (error) {
      console.error('조회 오류:', error.message)
      break
    }

    if (!stores || stores.length === 0) {
      console.log('변환할 가맹점이 없습니다.')
      break
    }

    console.log(`${stores.length}개 가맹점 처리 중... (offset: ${offset})`)

    for (const store of stores) {
      if (!store.address) {
        processed++
        continue
      }

      const coords = await geocodeAddress(store.address)

      if (coords) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', store.id)

        if (updateError) {
          console.error(`업데이트 실패 (ID: ${store.id}):`, updateError.message)
        } else {
          success++
        }
      } else {
        failedAddresses.push(`[${store.id}] ${store.address}`)
      }

      processed++

      if (processed % 100 === 0) {
        console.log(`진행: ${processed}개 처리됨 (성공: ${success}, 실패: ${failedAddresses.length})`)
      }

      // API 호출 제한 방지 (100ms 딜레이)
      await sleep(100)
    }

    // 다음 배치가 없으면 종료
    if (stores.length < batchSize) {
      break
    }

    offset += batchSize
  }

  console.log('\n=== 완료 ===')
  console.log(`총 처리: ${processed}개`)
  console.log(`성공: ${success}개`)
  console.log(`실패: ${failedAddresses.length}개`)

  if (failedAddresses.length > 0) {
    console.log('\n=== 실패한 주소 ===')
    failedAddresses.slice(0, 50).forEach((addr) => console.log(addr))
    if (failedAddresses.length > 50) {
      console.log(`... 외 ${failedAddresses.length - 50}개`)
    }
  }
}

main().catch(console.error)
