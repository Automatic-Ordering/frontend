# AutoOrder (편의점 자동발주 시스템) — Frontend

가상 편의점의 **판매 → 재고 차감 → 안전재고 기반 자동발주 추천 → 발주 명세서 확정 → 입고 반영** 전 과정을 웹에서 관리할 수 있는 **AutoOrder**의 React 프론트엔드 애플리케이션입니다.

---

## 목차
1. [주요 기능](#주요-기능)
2. [기술 스택 및 폴더 구조](#기술-스택-및-폴더-구조)
3. [사전 준비 사항](#사전-준비-사항)
4. [설치 및 환경 변수 설정](#설치-및-환경-변수-설정)
5. [개발 서버 실행](#개발-서버-실행)
6. [프로덕션 빌드 및 미리보기](#프로덕션-빌드-및-미리보기)
7. [배포 가이드 (Nginx / Vercel)](#배포-가이드-nginx--vercel)
8. [자주 발생하는 문제 해결 (Troubleshooting)](#자주-발생하는-문제-해결-troubleshooting)

---

## 주요 기능

### 1. 점포 운영 (`Store`)
- **대시보드 (`/store`)**: 오늘 매출(건수·금액), 최근 7일 누적 매출 및 일별 매출 막대 차트, 최근 7일 판매 TOP 5 상품, 재고 부족 및 발주 권장 품목 수 요약 조회
- **재고 관리 (`/store/inventory`)**: 점포별 보유 상품의 현재 재고, 안전재고, 정상/재고 부족 상태 조회 및 검색
- **판매 내역 및 등록 (`/store/sales`, `/store/sales/new`)**: 일자별 판매 내역 조회 및 신규 판매 등록(등록 시 현재 재고 자동 차감)
- **자동 발주 추천 (`/store/orders/recommendations`)**: 최근 7일 판매 데이터 기반 일평균 판매량 및 safety_stock, current_stock을 반영한 자동발주 추천 수량 표시. `analysis_days=7`, `safety_stock_days=2`, `lead_time_days=1` 기준 계산
- **발주 명세서 작성 (`/store/orders/specs/new`)**:
  - 자동발주 추천 수량(`max(0, avg_daily_sales × (lead_time_days + safety_stock_days) - current_stock`) 일괄 불러오기 및 수동 발주 수량 수정
  - 제품별 발주 단위(박스/묶음)와 order_multiplier 적용 및 추천 수량 표시/수정 UX
  - 발주 할 상품 최소 1개 이상 선택 필수
  - 통합 발주 명세서(`DRAFT`) 생성 후 `/store/orders/specs` 페이지로 이동
- **발주 내역 (`/store/orders/specs`)**: 임시 저장(`DRAFT`), 입고 대기(`PENDING_RECEIPT`), 입고 완료(`RECEIVED`) 상태별 명세서 조회, 임시 저장 수량 수정, 발주 확정 및 취소
- **입고 관리 (`/store/orders/receipts`)**: 확정된 발주서의 실제 입고 수량 입력(결품 `0`개 입력 지원), 주문 대비 입고 수량 차이 확인 및 재고 자동 반영
- **발주 설정 (`/store/orders/settings`)**: 카테고리 필터링 기반 상품별 안전재고 수량 설정 및 일괄 저장. `PATCH /api/store/order-settings` 로 analysis_days, safety_stock_days, lead_time_days 수정 가능
- **점포 설정 (`/store/settings`)**: 점포 기본 정보 및 운영 설정 관리

### 2. 본사·시스템 관리 (`Admin`)
- **관리자 대시보드 (`/admin`)**: 전체 가맹 점포 및 등록 상품 현황 요약
- **점포 관리 (`/admin/stores`, `/admin/stores/new`, `/admin/stores/:storeId`)**: 가맹 점포 목록 조회, 신규 점포 및 점주 계정 생성, 점포 상세 조회 및 삭제
- **상품 관리 (`/admin/products`)**: 본사 마스터 상품 목록 조회, 카테고리·단가 관리
- **발주 명세서 관리 (`/admin/orders/specs`)**: 전체 점포 발주 명세서 조회, 상세 조회

---

## 기술 스택 및 폴더 구조

- **Framework**: React 19, Vite
- **Routing**: React Router DOM (역할 기반 라우팅: AdminRoute, ProtectedRoute)
- **HTTP Client**: Axios (JWT 토큰 인증 및 공통 에러 처리 인터셉터), baseURL는 `VITE_API_BASE_URL` 환경 변수 사용
- **CSS**: Tailwind CSS 4 (`src/index.css`에서 `@import "tailwindcss"` 및 전역 스타일), Vanilla CSS 커스텀 속성
- **Icons**: Lucide React
- **형식화**: `oxlint` (리ント)

```text
frontend/
├── index.html                 # 브라우저 타이틀 (AutoOrder)
├── package.json               # 스크립트 및 의존성 명세
├── .env                       # 환경 변수 파일 (VITE_API_BASE_URL 등 직접 생성)
└── src/
    ├── AppRouter.jsx          # 권한(Store / Admin)별 라우팅 정의
    ├── index.css              # 전역 레이아웃, 카드, 테이블, 배지 스타일 (Tailwind 입구)
    ├── layouts/
    │   ├── AdminLayout.jsx    # 관리자 레이아웃 (사이드바 및 헤더)
    │   └── StoreLayout.jsx    # 점포 레이아웃 (사이드바 및 헤더)
    ├── contexts/
    │   └── AuthContext.jsx    # 로그인 세션 및 권한 상태 관리
    ├── pages/
    │   ├── auth/              # 인증 페이지 (LoginPage, LoginForm, LoginLayout)
    │   ├── admin/             # 관리자 페이지 (대시보드, 점포 관리, 상품 관리, 발주 명세서)
    │   └── store/             # 점포 페이지 (대시보드, 재고, 판매, 발주, 입고, 설정)
    ├── components/
    │   ├── layout.jsx         # 사이드바 내비게이션 및 헤더 레이아웃
    │   ├── orderSpec.jsx      # 발주 명세서 상세 모달 및 상태 배지 관련 유틸리티
    │   ├── Pagination.jsx     # 공통 페이지네이션
    │   └── ui.jsx             # Button, Card, StatCard, Modal, EmptyState, SearchInput, Badge 등
    ├── services/              # 백엔드 REST API 연동 모듈
    │   ├── api.js             # Axios 인스턴스 (baseURL: VITE_API_BASE_URL, auth 인터셉터, 에러 변환 헬퍼)
    │   ├── authService.js     # 로그인/로그아웃, 사용자 조회, 비밀번호 변경
    │   ├── orderService.js    # 발주 추천 조회, 주문 조회, 발주 기준 설정 CRUD
    │   ├── orderSpecService.js # 발주 명세서 CRUD (create, update items, submit, confirm, cancel, receipt)
    │   ├── productService.js  # 상품 관리 (get, create, update, delete)
    │   ├── salesService.js    # 판매 기록 (getSales, createSale)
    │   └── storeService.js    # 점포 CRUD (getStores, getStore, createStore, updateStoreStatus, deleteStore)
    └── styles.css             # 추가 Tailwind 유틸리티 및 컴포넌트 스타일 (971선)
```

---

## 사전 준비 사항

- Node.js 20+ 및 npm/yarn/pnpm
- 백엔드 API 서버가 구동되어 있어야 함 (`http://localhost:3000/api` 기본값 또는 `VITE_API_BASE_URL` 환경 변수 지정)
- `.env` 파일 생성 필요 (아래 환경 변수 참조)

---

## 설치 및 환경 변수 설정

```bash
# 종속성 설치
npm install

# 환경 변수 설정 (.env 파일이 존재하지 않을 경우 생성)
# 필수: 백엔드 API 서버 주소
VITE_API_BASE_URL=http://localhost:3000/api
```

`.env` 예시:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 개발 서버 실행

```bash
# 개발 서버 시작 (http://localhost:5173)
npm run dev

# 빌드
npm run build

# 미리보기
npm run preview

# 리ント
npm run lint

# 테스트
npm run test
```

---

## 배포 가이드 (Nginx / Vercel)

- **Vercel**: 리파지토리 연동 후 프론트엔드만 배포 가능. 환경 변수 `VITE_API_BASE_URL`은 Vercel 대시보드 > Settings > Environment Variables 에서 재설정 필요.
- **Nginx**: `npm run build` 로 생성된 `dist/` 디렉토리를 서브 디렉토리 또는 루트에 마운트하여 서빙하면 됨.

---

## 자주 발생하는 문제 해결 (Troubleshooting)

- **API 연결 오류 (401/ECONNREFUSED)**: `VITE_API_BASE_URL` 환경 변수가 올바른지 확인하고, 백엔드 서버가 실행 중인지 확인할 것.
- **인증 토큰 만료**: 로그아웃 후 다시 로그인하여 `auto-order-token` 로컬 스토리지 항목을 새로 발급받을 것.
- **발주 명세서 생성 실패**: 최소 1개 이상의 발주 품목을 선택했는지, 발주 수량이 1 이상의 정수인지 확인할 것.
- **재고가 부족하다고 표시되지 않을 경우**: `StoreInventory` 페이지에서 각 상품의 `current_stock` 과 `safety_stock` 필드 값을 확인할 것.

---

## API 엔드포인트 요약

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/store/dashboard` | 점포 대시보드 KPI 조회 |
| `GET` | `/store/orders/recommendations` | 자동 발주 추천 목록 조회 |
| `GET` | `/store/orders/recommendations/:productId` | 발주 추천 상세 (계산 근거 포함) |
| `GET` | `/store/order-settings` | 발주 기준 설정 조회 (`analysis_days`, `safety_stock_days`, `lead_time_days`) |
| `PATCH` | `/store/order-settings` | 발주 기준 설정 수정 |
| `GET` | `/store/products` | 점포 상품 목록 조회 |
| `GET` | `/store/orders/specs` | 발주 명세서 목록 조회 |
| `POST` | `/store/orders/specs` | 발주 명세서 생성 (DRAFT) |
| `PATCH` | `/store/orders/specs/:specId/items` | 발주 명세서 내 상품 수량 수정 |
| `POST` | `/store/orders/specs/:specId/submit` | DRAFT → REQUESTED 제출 |
| `POST` | `/store/orders/specs/:specId/confirm` | DRAFT → PENDING_RECEIPT 확정 |
| `POST` | `/store/orders/specs/:specId/cancel` | DRAFT/REQUESTED 취소 |
| `POST` | `/store/orders/specs/:specId/receipt` | 입고 처리 (재고 증가) |
| `GET` | `/admin/orders/specs` | 전체 점포 발주 명세서 조회 (본사) |
| `GET` | `/admin/products` | 본사 상품 관리 목록 조회 |
| `POST` | `/admin/stores` | 신규 점포 및 점주 계정 생성 |
| `GET` | `/admin/stores/:storeId` | 점포 상세 조회 |
| `GET` | `/store/sales` | 판매 내역 조회 |
| `POST` | `/store/sales` | 신규 판매 등록 |