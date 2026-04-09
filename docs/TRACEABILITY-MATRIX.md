# Divine Office Reader — 요구사항 추적 매트릭스 (Traceability Matrix)

> **목적**: 모듈 → PRD 기능 → 상태 → 단위 테스트 → E2E 테스트 → UX 시나리오 간 추적 가능한 매핑.
> **최종 갱신**: 2026-04-09

---

## 1. 전체 추적 매트릭스

### navigation 모듈

| PRD 기능 | 기능명 | 상태 | 단위 테스트 | E2E 테스트 | UX 시나리오 |
|----------|--------|------|-----------|-----------|------------|
| F-NAV | 계층 목차 네비게이션 | ✅ | — | E2E-D-NAV-01~08,10; E2E-M-NAV-09 | S1,S2,S4,S5,S8 |
| F-SEARCH | 텍스트 검색 | ✅ | — | E2E-D-SEARCH-01~06 | S4,S6 |
| F-BREAD | 브레드크럼 | ✅ | — | E2E-D-NAV-05 | S2,S6 |
| F-A11Y | 접근성 | ✅ | — | (NAV/SEARCH 간접 검증) | 전체 |
| F-XNAV | 교차 그룹 네비게이션 | 예정 | — | — | S1,S9 |
| F-KEYS | 키보드 단축키 | 예정 | — | — | — |

### settings 모듈

| PRD 기능 | 기능명 | 상태 | 단위 테스트 | E2E 테스트 | UX 시나리오 |
|----------|--------|------|-----------|-----------|------------|
| F-FONT | 폰트 크기 조절 | ✅ | — | E2E-D-SETTING-01,02 | S2,S3 |
| F-DARK | 다크 모드 | ✅ | — | E2E-D-SETTING-03,04 | S3,S5,S9 |
| F-PERSIST | 설정 영속성 | ✅ | reader-store.test.ts (5) | E2E-D-SETTING-05,06 | S1,S3 |
| F-DVHL | iOS viewport | ✅ | — | (수동) | S3 |

### content 모듈

| PRD 기능 | 기능명 | 상태 | 단위 테스트 | E2E 테스트 | UX 시나리오 |
|----------|--------|------|-----------|-----------|------------|
| F-LAZY | Lazy Loading | ✅ | — | E2E-D-LOAD-02,04,05; E2E-D-CONTENT-01~05 | S1,S2,S4,S5,S8 |
| F-SSR | SSR | ✅ | — | E2E-D-LOAD-01 | S5 |
| F-SKEL | 스켈레톤 로딩 | ✅ | — | E2E-D-LOAD-06 | S5 |
| F-MARKUP | 전례 텍스트 구조 마크업 | 예정 | — | — | S2 |
| F-RUBRIC | 루브릭 구분 | 예정 | — | — | S3 |
| F-FULLSEARCH | 본문 검색 | 예정 | — | — | S2,S4,S6 |
| F-OFFLINE | 오프라인 지원 | 예정 | — | — | S7 |

### prayer-flow 모듈

| PRD 기능 | 기능명 | 상태 | 단위 테스트 | E2E 테스트 | UX 시나리오 |
|----------|--------|------|-----------|-----------|------------|
| F-FLOW | 기도 흐름 가이드 | 진행중 | — | E2E-D-FLOW-01~03; E2E-M-FLOW-05 | S1,S9 |
| F-XNAV | 교차 그룹 네비게이션 | 예정 | — | E2E-D-FLOW-04 | S1,S9 |
| F-CALENDAR | 전례력 연동 | 예정 | — | — | S1,S8,S9 |
| F-PROGRESS | 읽기 진행률 | 예정 | — | — | — |

### data-pipeline 모듈

| PRD 기능 | 기능명 | 상태 | 단위 테스트 | E2E 테스트 | UX 시나리오 |
|----------|--------|------|-----------|-----------|------------|
| T-CLEAN | 데이터 정제 | ✅ | T-CLEAN-01~07 (7) | — | — |
| T-STRUCT | 데이터 구조 검증 | ✅ | T-STRUCT-01~08 (8) | — | — |
| T-SEG | 데이터 분할 검증 | ✅ | T-SEG-01~04 (4) | — | — |

---

## 2. 요약 통계

### 기능 상태별 분류

| 상태 | 기능 수 | 기능 ID |
|------|---------|---------|
| ✅ 구현 완료 | 15 | F-NAV, F-SEARCH, F-BREAD, F-A11Y, F-FONT, F-DARK, F-PERSIST, F-DVHL, F-LAZY, F-SSR, F-SKEL, T-CLEAN, T-STRUCT, T-SEG |
| 진행중 | 1 | F-FLOW |
| 예정 | 8 | F-XNAV, F-KEYS, F-MARKUP, F-RUBRIC, F-FULLSEARCH, F-OFFLINE, F-CALENDAR, F-PROGRESS |

### 테스트 커버리지 요약

| 테스트 유형 | 테스트 수 | 커버 기능 수 |
|------------|----------|-------------|
| 단위 테스트 (Vitest) | 24 | 4 (F-PERSIST, T-CLEAN, T-STRUCT, T-SEG) |
| E2E 테스트 (Playwright) | 37 | 10 (구현된 11개 기능 중 F-DVHL 제외) |
| 수동 테스트 | — | 1 (F-DVHL) |

### 시나리오별 E2E 커버리지

| 시나리오 | 설명 | E2E 테스트 수 | 커버리지 |
|----------|------|-------------|----------|
| S1 | 매일 아침기도 (모바일) | 7 | 부분 (F-XNAV, F-FLOW 미구현) |
| S2 | 사순 시기 전례 준비 (데스크탑) | 7 | 부분 (본문 검색, 마크업 미구현) |
| S3 | 야간 기도 (태블릿/다크모드) | 5 | 양호 |
| S4 | 찬미가 검색 (모바일) | 6 | 부분 (본문 검색 미구현) |
| S5 | 처음 방문 | 6 | 양호 |
| S6 | 특정 시편 찾기 (데스크탑) | 4 | 부분 (본문 검색 미구현) |
| S7 | 인터넷 불안정 환경 | 0 | **미커버** (F-OFFLINE 미구현) |
| S8 | 전례 시기 전환 | 4 | 부분 (F-CALENDAR 미구현) |
| S9 | 저녁기도 전체 흐름 | 4 | 부분 (F-XNAV, F-FLOW 진행중) |

---

## 3. 커버리지 갭 (Coverage Gaps)

### 3.1 테스트가 없는 구현 기능

| 기능 | 이유 | 권장 조치 |
|------|------|----------|
| F-A11Y | ARIA 속성이 NAV/SEARCH 테스트에서 간접 검증만 됨 | 전용 접근성 E2E 테스트 추가 (axe-core 등) |
| F-DVHL | CSS 속성으로 E2E 직접 검증 어려움 | iOS 디바이스 수동 테스트 체크리스트 작성 |

### 3.2 단위 테스트가 없는 구현 기능

| 기능 | 권장 조치 |
|------|----------|
| F-NAV | 트리 노드 펼치기/접기 로직 단위 테스트 |
| F-SEARCH | 제목 검색 필터링 로직 단위 테스트 |
| F-BREAD | 브레드크럼 경로 생성 로직 단위 테스트 |
| F-FONT | 폰트 크기 범위 제한 로직 단위 테스트 |
| F-DARK | 다크모드 토글 + FOUC 방지 로직 단위 테스트 |
| F-LAZY | 그룹 로딩/dedup 로직 단위 테스트 |

### 3.3 E2E 테스트가 없는 예정 기능

| 기능 | 상태 | E2E 계획 | 우선순위 |
|------|------|----------|---------|
| F-XNAV | 예정 | `х. NNN` 링크 클릭 → 교차 이동 검증 | P0 |
| F-KEYS | 예정 | 키보드 단축키 동작 검증 | P1 |
| F-MARKUP | 예정 | 전례 텍스트 요소별 CSS 클래스 검증 | P0 |
| F-RUBRIC | 예정 | 루브릭 색상 구분 검증 | P0 |
| F-FULLSEARCH | 예정 | 본문 텍스트 검색 결과 검증 | P0 |
| F-OFFLINE | 예정 | Service Worker 캐시 + 오프라인 동작 검증 | P2 |
| F-CALENDAR | 예정 | 오늘 날짜 → 기도 자동 선택 검증 | P3 |
| F-PROGRESS | 예정 | 진행률 바 표시 검증 | P1 |

### 3.4 UX 시나리오 커버리지 갭

| 시나리오 | 갭 | 영향 기능 |
|----------|-----|----------|
| S1 (아침기도) | 교차 그룹 이동이 수동 사이드바에만 의존, 이전 위치 복귀 불가 | F-XNAV, F-FLOW |
| S7 (오프라인) | 테스트 0건 — 시나리오 전체 미커버 | F-OFFLINE |
| S9 (저녁기도) | 4회 그룹 간 교차 이동의 자동화 검증 없음 | F-XNAV, F-FLOW, F-CALENDAR |

### 3.5 모바일 전용 테스트 갭

| 영역 | 현재 | 갭 |
|------|------|-----|
| 모바일 네비게이션 | E2E-M-NAV-03, 09 (2개) | 모바일 검색, 폰트 조절, 브레드크럼 전용 테스트 부족 |
| 모바일 콘텐츠 | E2E-M-CONTENT-01 (1개) | 모바일에서 그룹 전환, propers/hymns 로드 테스트 부재 |
| 태블릿 | 0개 | 태블릿 viewport(768x1024) 전용 테스트 없음 (S3, S8, S9 시나리오) |

---

## 4. 기능 간 의존성

```
F-FLOW ──depends──► F-NAV (목차 네비게이션)
F-FLOW ──depends──► F-LAZY (그룹 로딩)
F-FLOW ──depends──► F-PERSIST (위치 기억)
F-XNAV ──depends──► F-LAZY (교차 그룹 로딩)
F-XNAV ──enables──► F-FLOW (원클릭 교차 이동)
F-CALENDAR ──enables──► F-FLOW (오늘 기도 자동 구성)
F-FULLSEARCH ──extends──► F-SEARCH (제목→본문 확장)
F-MARKUP ──enables──► F-RUBRIC (구조 마크업 위에 색상 구분)
T-CLEAN ──validates──► F-LAZY (로드되는 데이터 품질)
T-STRUCT ──validates──► F-NAV (목차 트리 정합성)
```

---

## 5. 참조

| 문서 | 경로 |
|------|------|
| 모듈형 PRD 인덱스 | [`docs/prd/README.md`](./prd/README.md) |
| navigation PRD | [`docs/prd/navigation.md`](./prd/navigation.md) |
| settings PRD | [`docs/prd/settings.md`](./prd/settings.md) |
| content PRD | [`docs/prd/content.md`](./prd/content.md) |
| prayer-flow PRD | [`docs/prd/prayer-flow.md`](./prd/prayer-flow.md) |
| data-pipeline PRD | [`docs/prd/data-pipeline.md`](./prd/data-pipeline.md) |
| UX 시나리오 | [`docs/UX-SCENARIOS.md`](./UX-SCENARIOS.md) |
| E2E 테스트 계획 | [`docs/E2E-TEST-PLAN.md`](./E2E-TEST-PLAN.md) |
