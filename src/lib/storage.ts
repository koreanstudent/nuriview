import { supabase } from './supabase'
import imageCompression from 'browser-image-compression'

const BUCKET_NAME = 'reviews'

// 이미지 압축 옵션
const compressionOptions = {
  maxSizeMB: 0.2, // 최대 200KB
  maxWidthOrHeight: 1200,
  useWebWorker: true,
}

export async function uploadReviewImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // 이미지 압축
    const compressedFile = await imageCompression(file, compressionOptions)

    // 파일명 생성 (userId_timestamp.webp)
    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}.webp`

    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, compressedFile, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1년 캐시
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: null, error: '이미지 업로드에 실패했습니다.' }
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return { url: urlData.publicUrl, error: null }
  } catch (err) {
    console.error('Image processing error:', err)
    return { url: null, error: '이미지 처리에 실패했습니다.' }
  }
}

export async function deleteReviewImage(imageUrl: string): Promise<void> {
  try {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`)
    if (pathParts.length < 2) return

    const filePath = pathParts[1]

    await supabase.storage.from(BUCKET_NAME).remove([filePath])
  } catch (err) {
    console.error('Delete image error:', err)
  }
}
