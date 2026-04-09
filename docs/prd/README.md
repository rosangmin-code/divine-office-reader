# Divine Office Reader — 모듈형 PRD 인덱스

> **버전**: 0.1.0
> **최종 갱신**: 2026-04-09

---

## 1. 프로젝트 개요

**제품명:** Divine Office Reader (성무일도 리더)
**배포 URL:** https://divine-office-reader.vercel.app
**GitHub:** https://github.com/rosangmin-code/divine-office-reader

**한 줄 요약:** 몽골어 성무일도(시간전례) 텍스트를 구조화된 목차와 함께 제공하는 반응형 웹 이북 리더.

**대상 사용자:**
- 몽골 가톨릭 사제, 수도자, 신자
- 한국인 선교사 (한국어 UI 병기)
- 전례 텍스트를 디지털로 열람하고자 하는 모든 사용자

---

## 2. 아키텍처 개요

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

---

## 3. 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | 4.0 |
| Language | TypeScript (strict) | 5.x |
| Unit Test | Vitest | 4.1.2 |
| E2E Test | Playwright | 1.59.1 |
| Deploy | Vercel | Production |

---

## 4. 품질 기준

### 4.1 성능 목표
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- 콘텐츠 첫 그룹 로드: < 1s (Cache-Control: immutable)

### 4.2 테스트 기준
- Vitest 유닛 테스트: 전체 통과
- 데이터 품질 테스트 (T-CLEAN, T-STRUCT): 전체 통과
- Playwright E2E: desktop + mobile 전체 통과
- 빌드 QA: `\f`, `\t`, 빈 제목 0건

### 4.3 접근성 기준
- WCAG 2.1 AA 준수
- 키보드 전체 접근 가능
- 스크린리더 호환 (ARIA roles, labels)
- 44px 최소 터치 타겟

---

## 5. 기술 제약

- **소스 데이터**: PDF에서 추출한 몽골어 텍스트 (`parsed_data/`), 수동 전처리 필요
- **정적 콘텐츠**: 실시간 업데이트 없음 (빌드 타임 JSON 생성)
- **인증 없음**: 공개 읽기 전용 앱
- **서버 상태 없음**: 모든 사용자 데이터 클라이언트 localStorage
- **단일 언어 콘텐츠**: 본문은 몽골어, UI는 한국어+몽골어 병기

---

## 6. 모듈별 PRD

| 모듈 | 파일 | 기능 수 | 설명 |
|------|------|---------|------|
| [navigation](./navigation.md) | `navigation.md` | 6 | 목차 네비게이션, 검색, 브레드크럼, 접근성 |
| [settings](./settings.md) | `settings.md` | 4 | 폰트, 다크모드, 설정 영속성, iOS viewport |
| [content](./content.md) | `content.md` | 7 | 콘텐츠 로딩, SSR, 스켈레톤, 마크업, 오프라인 |
| [prayer-flow](./prayer-flow.md) | `prayer-flow.md` | 4 | 기도 흐름 가이드, 교차 네비게이션, 전례력 |
| [data-pipeline](./data-pipeline.md) | `data-pipeline.md` | 3 | 빌드 파이프라인, 데이터 품질 테스트 |

---

## 7. 관련 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| 추적 매트릭스 | [`docs/TRACEABILITY-MATRIX.md`](../TRACEABILITY-MATRIX.md) | 모듈 → 기능 → 테스트 → 시나리오 매핑 |
| UX 시나리오 | [`docs/UX-SCENARIOS.md`](../UX-SCENARIOS.md) | 페르소나별 9개 사용 시나리오 |
| E2E 테스트 계획 | [`docs/E2E-TEST-PLAN.md`](../E2E-TEST-PLAN.md) | E2E 테스트 ID 체계 및 RTM |
| 기도 순서 가이드 | [`docs/PRAYER-GUIDE.md`](../PRAYER-GUIDE.md) | 아침/저녁기도 교차 이동 안내 |

---

## 8. 향후 로드맵 제안

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
