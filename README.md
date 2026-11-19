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
- **발주 명세서 작성 (`/store/orders/specs/new`)**:
  - 최근 7일 판매량과 안전재고를 반영한 자동발주 추천 수량($\max(0, \text{최근 7일 판매량} + \text{안전재고} - \text{현재 재고})$) 일괄 불러오기 및 수동 발주 품목 추가
- **발주 내역 (`/store/orders/specs`)**: 임시 저장(`DRAFT`), 입고 대기(`PENDING_RECEIPT`), 입고 완료(`RECEIVED`) 상태별 명세서 조회, 임시 저장 수량 수정, 발주 확정 및 취소
- **입고 관리 (`/store/orders/receipts`)**: 확정된 발주서의 실제 입고 수량 입력(결품 `0`개 입력 지원), 주문 대비 입고 수량 차이 확인 및 재고 자동 반영
- **발주 설정 (`/store/orders/settings`)**: 카테고리 필터링 기반 상품별 안전재고 수량 설정 및 일괄 저장
- **점포 설정 (`/store/settings`)**: 점포 기본 정보 및 운영 설정 관리

### 2. 본사·시스템 관리 (`Admin`)
- **관리자 대시보드 (`/admin`)**: 전체 가맹 점포 및 등록 상품 현황 요약
- **점포 관리 (`/admin/stores`, `/admin/stores/new`, `/admin/stores/:storeId`)**: 가맹 점포 목록 조회, 신규 점포 및 점주 계정 생성, 점포 상세 조회 및 삭제
- **상품 관리 (`/admin/products`)**: 본사 마스터 상품 목록 조회, 카테고리·단가 관리

---

## 기술 스택 및 폴더 구조

- **Framework**: React 19, Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios (JWT 토큰 인증 및 공통 에러 처리 인터셉터)
- **Icons & Styling**: Lucide React, Vanilla CSS (`index.css` 및 공통 UI 컴포넌트)

```text
frontend/
├── index.html                 # 브라우저 타이틀 (AutoOrder)
├── package.json               # 스크립트 및 의존성 명세
├── .env                       # 환경 변수 파일 (직접 생성)
└── src/
    ├── AppRouter.jsx          # 권한(Store / Admin)별 라우팅 정의
    ├── index.css              # 전역 레이아웃, 카드, 테이블, 배지 스타일
    ├── components/
    │   ├── layout.jsx         # 사이드바 내비게이션 및 헤더 레이아웃
    │   ├── orderSpec.jsx      # 발주 명세서 상세 모달 및 상태 배지
    │   ├── Pagination.jsx     # 공통 페이지네이션
    │   └── ui.jsx             # Button, Card, StatCard, Modal, EmptyState 등
    ├── contexts/
    │   └── AuthContext.jsx    # 로그인 세션 및 권한 상태 관리
    ├── pages/
    │   ├── admin/             # 관리자 페이지 (대시보드, 점포 관리, 상품 관리)
    │   └── store/             # 점포 페이지 (대시보드, 재고, 판매, 발주, 입고, 설정)
    └── services/              # 백엔드 REST API 연동 모듈