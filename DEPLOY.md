# 누리뷰 배포 가이드

## Git 커밋 & Push

### 1. 변경사항 확인
```bash
git status
```

### 2. 변경사항 스테이징
```bash
git add -A
```

### 3. 커밋
```bash
git commit -m "커밋 메시지"
```

### 4. Push
```bash
git push
```

> GitHub Personal Access Token이 필요합니다.
> - Username: GitHub 이메일
> - Password: Personal Access Token (비밀번호 아님)

---

## Vercel 배포

### 최초 배포

1. https://vercel.com 접속
2. **Sign up with GitHub** 클릭
3. **Add New Project** 클릭
4. `nuriview` 레포지토리 **Import**
5. Environment Variables 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   NEXT_PUBLIC_KAKAO_MAP_KEY = your-kakao-js-key
   ```
6. **Deploy** 클릭

### 자동 배포

GitHub에 push하면 Vercel이 자동으로 배포합니다.

배포 상태 확인: https://vercel.com/dashboard

---

## Supabase 테이블 설정

### 필수 테이블

```sql
-- stores (가맹점)
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  road_address TEXT,
  lat DECIMAL(10, 7) DEFAULT 0,
  lng DECIMAL(10, 7) DEFAULT 0,
  phone VARCHAR(50),
  market_name VARCHAR(255),
  category VARCHAR(100),
  card_available BOOLEAN DEFAULT false,
  mobile_available BOOLEAN DEFAULT false,
  paper_available BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reviews (후기)
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_available BOOLEAN DEFAULT true,
  min_amount INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reports (제보)
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- favorites (즐겨찾기)
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- store_submissions (가맹점 제보)
CREATE TABLE store_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  category VARCHAR(100),
  note TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- review_likes (리뷰 좋아요)
CREATE TABLE review_likes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, review_id)
);
```

### RLS 비활성화 (개발용)

```sql
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes DISABLE ROW LEVEL SECURITY;
```

---

## Supabase Storage 설정

### 버킷 생성

1. Supabase Dashboard → Storage
2. New bucket → Name: `reviews`
3. Public bucket 체크
4. Create bucket

### Storage 정책 (SQL Editor)

```sql
-- 모든 작업 허용
CREATE POLICY "Allow all operations on reviews"
ON storage.objects
FOR ALL
USING (bucket_id = 'reviews')
WITH CHECK (bucket_id = 'reviews');
```

---

## Kakao 지도 설정

배포 후 Kakao Developers에서 도메인 등록 필요:

1. https://developers.kakao.com 접속
2. 내 애플리케이션 → 앱 선택
3. 플랫폼 → Web → 사이트 도메인 추가
4. 배포된 도메인 입력 (예: `https://nuriview.vercel.app`)

---

## 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 가맹점 데이터 가져오기
npm run fetch-stores

# 좌표 검색
npm run search-coords
```
