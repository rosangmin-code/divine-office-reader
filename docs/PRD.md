# Divine Office Reader — Product Requirements Document (PRD)

## 1. 제품 개요

**제품명:** Divine Office Reader (성무일도 리더)
**버전:** 0.1.0
**배포 URL:** https://divine-office-reader.vercel.app
**GitHub:** https://github.com/rosangmin-code/divine-office-reader

**한 줄 요약:** 몽골어 성무일도(시간전례) 텍스트를 구조화된 목차와 함께 제공하는 반응형 웹 이북 리더.

**대상 사용자:**
- 몽골 가톨릭 사제, 수도자, 신자
- 한국인 선교사 (한국어 UI 병기)
- 전례 텍스트를 디지털로 열람하고자 하는 모든 사용자

---

## 2. 현재 상태 (As-Is)

### 2.1 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | 4.0 |
| Language | TypeScript (strict) | 5.x |
| Unit Test | Vitest | 4.1.2 |
| E2E Test | Playwright | 1.59.1 |
| Deploy | Vercel | Production |

### 2.2 아키텍처

```
[Server Component: page.tsx]
  ↓ bookmarks.json (120KB) SSR
[Client Component: ReaderShell]
  ├── Toolbar (폰트, 다크모드, 사이드바 토글)
  ├── Breadcrumb (현재 위치 경로)
  ├── MobileSidebar (md:hidden, fixed overlay)
  ├── DesktopSidebar (md:flex, static)
  └── main (lazy-loaded articles)
       └── /api/content/[group] → week1~4, propers, hymns JSON
```

**상태 관리:** React hooks only (useState, useEffect, useRef, useCallback)
**영속성:** localStorage (`divine-office-reader-settings`)
**콘텐츠 전달:** 6개 그룹 분할 JSON + Route Handler + in-flight dedup

### 2.3 데이터 구조

| 그룹 | 섹션 수 | 크기 | 설명 |
|------|---------|------|------|
| week1 | 61 | 99KB | 시편집 1주차 |
| week2 | 61 | 103KB | 시편집 2주차 |
| week3 | 58 | 96KB | 시편집 3주차 |
| week4 | 58 | 128KB | 시편집 4주차 |
| propers | 89 | 278KB | 시기별 고유문 (6개 시즌 → 주일/축일 세분화) |
| hymns | 109 | 57KB | 찬미가 (번호별 개별 분리) |
| **합계** | **436** | **780KB** | |

**목차 트리:** 478개 노드, 최대 depth 5
- root → psalter/propers/hymns → week/season → day/Sunday → leaf

### 2.4 구현된 기능

| ID | 기능 | 상태 | 설명 |
|----|------|------|------|
| F-NAV | 계층 목차 네비게이션 | ✅ | 트리뷰 + 자동 펼치기 + 활성 항목 하이라이트 |
| F-SEARCH | 텍스트 검색 | ✅ | 제목 기반 검색 (2자 이상) |
| F-FONT | 폰트 크기 조절 | ✅ | 14-32px, ±2px 단위 |
| F-DARK | 다크 모드 | ✅ | 토글 + localStorage 영속 + FOUC 방지 |
| F-BREAD | 브레드크럼 | ✅ | 현재 위치 경로 표시 |
| F-PERSIST | 설정 영속성 | ✅ | 마지막 읽기 위치, 폰트, 다크모드 기억 |
| F-LAZY | Lazy loading | ✅ | 6개 그룹 분할, 스크롤 기반 pre-fetch |
| F-SSR | SSR | ✅ | bookmarks SSR + content lazy |
| F-MOBILE | 모바일 반응형 | ✅ | 사이드바 오버레이, 44px 터치 타겟 |
| F-A11Y | 접근성 | ✅ | ARIA tree, 키보드 네비게이션, sr-only |
| F-SKEL | 스켈레톤 로딩 | ✅ | 콘텐츠 로딩 중 pulse 애니메이션 |
| F-DVHL | iOS viewport | ✅ | 100dvh 지원 |

### 2.5 테스트 현황

| 종류 | 테스트 수 | 통과율 |
|------|----------|--------|
| Vitest (유닛) | 5 | 100% |
| Vitest (데이터 품질) | 15 | 100% |
| Playwright E2E | 17 (5 skipped) | 100% |

### 2.6 빌드 파이프라인

```
소스 텍스트 (parsed_data/)
  ↓ npm run build:data (DIVINE_OFFICE_SOURCE env)
구조화 JSON (public/data/)
  ↓ npm run build
Next.js 정적 생성 + Route Handler
  ↓ npx vercel --prod
Vercel Production
```

빌드 타임 QA: `\f`, `\t`, 빈 제목 자동 검출

---

## 3. 알려진 제한사항 및 미해결 이슈

### 3.1 콘텐츠 품질

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| propers 일부 대형 leaf | 중 | `propers-saints-хамаг-гэгээнтнүүд` 49KB, `propers-christmas-...` 32KB |
| hymns 단문 항목 | 저 | 109곡 중 7개가 120자 미만 |
| 제목 중복 | 저 | 67그룹/181건 (요일별 기도 구조상 불가피) |
| 본문 검색 미지원 | 중 | 현재 제목만 검색 가능 |

### 3.2 UI/UX

| ID | 이슈 | 심각도 | 상세 |
|----|------|--------|------|
| F-MARKUP | 전례 텍스트 구조 미표현 | 중 | 시편/찬가/독서/응답구 시각적 구분 없음 |
| F-RUBRIC | 루브릭(지시문) 미구분 | 중 | 빨간색 사제 지시문 vs 검정색 기도문 구분 없음 |
| F-KEYS | 키보드 단축키 없음 | 저 | Ctrl+F, 방향키 네비게이션 등 |
| F-PROGRESS | 읽기 진행률 미표시 | 저 | 현재 섹션 위치/전체 비율 |
| F-OFFLINE | 오프라인 미지원 | 중 | Service Worker/PWA 없음 |
| F-FULLSEARCH | 본문 검색 미지원 | 중 | 현재 제목만 검색 가능 |
| F-CALENDAR | 전례력 연동 미지원 | 중 | 오늘 날짜 → 해당 기도 자동 선택 |

### 3.3 기술 부채

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| 시스템 폰트 의존 | 중 | 몽골어 최적화 웹폰트 없음 (Georgia 폴백) |
| README 미갱신 | 저 | 기본 Next.js 템플릿 README 그대로 |
| i18n 프레임워크 없음 | 저 | 한국어/몽골어 하드코딩 |

---

## 4. 향후 로드맵 제안

### Phase 1: 콘텐츠 품질 완성 (P0)
- 대형 propers leaf 추가 분할 (20KB 이하 목표)
- 본문 내용 검색 (full-text search)
- 전례 텍스트 구조 마크업 (시편/독서/응답구 시각 구분)

### Phase 2: 사용자 경험 강화 (P1)
- 키보드 단축키 (← → 이전/다음 섹션, / 검색, D 다크모드)
- 읽기 진행률 표시바
- 전례 시기별 테마 색상 (대림-보라, 성탄-금, 사순-보라, 부활-백)
- 몽골어 웹폰트 (Noto Serif)

### Phase 3: 오프라인 및 설치 (P2)
- PWA (Service Worker, manifest.json)
- 오프라인 캐싱 (전체 콘텐츠 780KB, 오프라인 가능)
- 홈 화면 추가 (Add to Home Screen)

### Phase 4: 고급 기능 (P3)
- 북마크/즐겨찾기 기능
- 전례력 연동 (오늘 날짜 → 해당 기도 자동 선택)
- 다국어 확장 (몽골어/한국어/영어)
- 인쇄 최적화 CSS

---

## 5. 품질 기준

### 5.1 성능 목표
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- 콘텐츠 첫 그룹 로드: < 1s (Cache-Control: immutable)

### 5.2 테스트 기준
- Vitest 유닛 테스트: 전체 통과
- 데이터 품질 테스트 (T-CLEAN, T-STRUCT): 전체 통과
- Playwright E2E: desktop + mobile 전체 통과
- 빌드 QA: `\f`, `\t`, 빈 제목 0건

### 5.3 접근성 기준
- WCAG 2.1 AA 준수
- 키보드 전체 접근 가능
- 스크린리더 호환 (ARIA roles, labels)
- 44px 최소 터치 타겟

---

## 6. 기술 제약

- **소스 데이터**: PDF에서 추출한 몽골어 텍스트 (`parsed_data/`), 수동 전처리 필요
- **정적 콘텐츠**: 실시간 업데이트 없음 (빌드 타임 JSON 생성)
- **인증 없음**: 공개 읽기 전용 앱
- **서버 상태 없음**: 모든 사용자 데이터 클라이언트 localStorage
- **단일 언어 콘텐츠**: 본문은 몽골어, UI는 한국어+몽골어 병기
