# 누리 - 온누리상품권 가맹점 후기 서비스

온누리상품권 가맹점 실시간 후기 및 정보 공유 플랫폼

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **지도**: Kakao Maps SDK
- **아이콘**: Lucide React

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATA_API_KEY=your_public_data_api_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_javascript_key
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 실행:

```sql
-- 가맹점 테이블
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  market_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  road_address TEXT DEFAULT '',
  category TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  paper_available BOOLEAN DEFAULT FALSE,
  card_available BOOLEAN DEFAULT FALSE,
  mobile_available BOOLEAN DEFAULT FALSE
);

ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- 리뷰 테이블
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_available BOOLEAN DEFAULT TRUE,
  min_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reviews_store_id ON reviews(store_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- 제보 테이블
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'no_voucher')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reports_store_id ON reports(store_id);
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인

## 스크립트

### 가맹점 데이터 가져오기

공공 API에서 온누리 가맹점 데이터를 Supabase에 저장:

```bash
npm run fetch-stores
```

### 주소 → 좌표 변환

가맹점 주소를 카카오 API로 좌표 변환:

```bash
npm run geocode
```

> 참고: 공공 API 데이터에 상세 주소가 없어서 좌표 변환이 안 될 수 있음

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 페이지
│   ├── layout.tsx            # 공통 레이아웃
│   ├── login/page.tsx        # 로그인
│   ├── signup/page.tsx       # 회원가입
│   ├── map/page.tsx          # 지도 페이지
│   └── stores/
│       ├── page.tsx          # 가맹점 목록
│       └── [id]/page.tsx     # 가맹점 상세
├── components/
│   ├── Header.tsx            # 공통 헤더
│   ├── AuthButton.tsx        # 로그인/로그아웃 버튼
│   ├── StoreCard.tsx         # 가맹점 카드
│   ├── ReviewForm.tsx        # 리뷰 작성 폼
│   ├── ReviewList.tsx        # 리뷰 목록
│   └── KakaoMap.tsx          # 카카오맵 컴포넌트
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── auth.ts               # 인증 유틸
│   └── reviews.ts            # 리뷰 CRUD
├── types/
│   ├── index.ts              # 타입 정의
│   └── kakao.d.ts            # 카카오맵 타입
└── scripts/
    ├── fetch-stores.ts       # 가맹점 데이터 수집
    └── geocode-stores.ts     # 좌표 변환
```

## 주요 기능

### 가맹점 목록 (/stores)
- 검색: 가맹점명, 주소
- 필터: 지역, 결제수단 (지류/카드/모바일)
- 정렬: 이름순, 최신순
- 페이지네이션

### 가맹점 상세 (/stores/[id])
- 기본 정보 (이름, 주소, 업종)
- 결제수단 뱃지
- 미니 지도
- 상태 제보 (영업중/폐업/상품권 안받음)
- 리뷰 작성 및 목록

### 지도 (/map)
- 카카오맵 전체 화면
- 마커 클러스터링
- 현재 위치 버튼
- 마커 클릭 시 인포윈도우

### 인증
- 이메일/비밀번호 회원가입
- 로그인/로그아웃
- Supabase Auth 사용

## 카카오맵 설정

1. https://developers.kakao.com 에서 앱 생성
2. **앱 키** 탭에서 JavaScript 키 복사 → `NEXT_PUBLIC_KAKAO_MAP_KEY`
3. **앱 키** 탭에서 REST API 키 복사 → `KAKAO_REST_API_KEY`
4. **플랫폼** → **Web** → `http://localhost:3000` 등록

## API 정보

### 공공 데이터 API (온누리 가맹점)
- URL: `https://api.odcloud.kr/api/3060079/v1/uddi:7ffa42f8-01d1-4329-aa94-aefb67c53cf1`
- 인증: `serviceKey` 파라미터

### 카카오 주소 검색 API
- URL: `https://dapi.kakao.com/v2/local/search/address.json`
- 인증: `Authorization: KakaoAK {REST_API_KEY}` 헤더
