# Divine Office Reader — E2E 테스트 계획 및 요구사항 추적 매트릭스

> PRD 기능 ID × UX 시나리오 × E2E 테스트 ID 간 추적 가능한 매핑.

---

## 1. 테스트 ID 체계

```
E2E-{viewport}-{category}-{number}
```

- viewport: `D` (desktop 1280x720), `M` (mobile 375x812)
- category: `LOAD`, `NAV`, `SEARCH`, `SETTING`, `CONTENT`
- number: 01, 02, ...

---

## 2. E2E 테스트 목록

### LOAD: 페이지 로드

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-LOAD-01 | 메인 페이지 로드, Loading 텍스트 없음 | Desktop | F-SSR | S5 |
| E2E-M-LOAD-01 | 메인 페이지 로드, Loading 텍스트 없음 | Mobile | F-SSR | S5 |
| E2E-D-LOAD-02 | Content API 200 응답 (week1) | Desktop | F-LAZY | S1, S5 |
| E2E-M-LOAD-02 | Content API 200 응답 (week1) | Mobile | F-LAZY | S1, S5 |
| E2E-D-LOAD-03 | 잘못된 그룹 404 응답 | Desktop | F-LAZY | - |
| E2E-M-LOAD-03 | 잘못된 그룹 404 응답 | Mobile | F-LAZY | - |
| E2E-D-LOAD-04 | Content API 200 (propers) | Desktop | F-LAZY | S2, S8 |
| E2E-D-LOAD-05 | Content API 200 (hymns) | Desktop | F-LAZY | S4 |
| E2E-D-LOAD-06 | 스켈레톤 로딩 표시 후 본문 전환 | Desktop | F-SKEL | S5 |

### NAV: 네비게이션

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-NAV-01 | 사이드바 트리 leaf 클릭 → 본문 스크롤 | Desktop | F-NAV | S1, S2 |
| E2E-D-NAV-02 | 사이드바 토글 열기/닫기 | Desktop | F-NAV | S2, S6 |
| E2E-M-NAV-03 | 모바일 오버레이 열기/닫기 | Mobile | F-MOBILE | S1, S4 |
| E2E-D-NAV-04 | 컨테이너 노드 클릭 → 첫 leaf로 이동 | Desktop | F-NAV | S2, S8 |
| E2E-D-NAV-05 | 브레드크럼 경로 표시 | Desktop | F-BREAD | S2, S6 |
| E2E-D-NAV-06 | propers 시즌 펼치기 → 하위 주일 표시 | Desktop | F-NAV | S2, S8 |
| E2E-D-NAV-07 | hymns 펼치기 → 개별 찬미가 표시 | Desktop | F-NAV | S4 |
| E2E-D-NAV-08 | week 트리 펼치기 → 요일 → 기도시간 | Desktop | F-NAV | S1 |
| E2E-M-NAV-09 | 모바일 leaf 클릭 → 스크롤 + 사이드바 닫힘 | Mobile | F-MOBILE, F-NAV | S1, S4 |
| E2E-D-NAV-10 | 활성 항목 사이드바 자동 스크롤 | Desktop | F-NAV | S1 |

### SEARCH: 검색

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-SEARCH-01 | 제목 검색 결과 표시 | Desktop | F-SEARCH | S4, S6 |
| E2E-D-SEARCH-02 | 검색 결과 클릭 → 네비게이션 + 검색 초기화 | Desktop | F-SEARCH | S4, S6 |
| E2E-D-SEARCH-03 | 시편 번호 "141" 검색 → 결과 포함 | Desktop | F-SEARCH | S6 |
| E2E-D-SEARCH-04 | 찬미가 번호 "42" 검색 → 결과 포함 | Desktop | F-SEARCH | S4 |
| E2E-D-SEARCH-05 | 2자 미만 입력 → 결과 없음 (트리 유지) | Desktop | F-SEARCH | - |
| E2E-D-SEARCH-06 | 검색 결과 없음 → "검색 결과 없음" 메시지 | Desktop | F-SEARCH | - |

### SETTING: 읽기 설정

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-SETTING-01 | 폰트 확대 A+ → +2px | Desktop | F-FONT | S2, S3 |
| E2E-M-SETTING-01 | 폰트 확대 A+ → +2px (모바일) | Mobile | F-FONT | S3 |
| E2E-D-SETTING-02 | 폰트 축소 A- → -2px | Desktop | F-FONT | S2 |
| E2E-D-SETTING-03 | 다크 모드 토글 → html.dark 클래스 | Desktop | F-DARK | S3, S5 |
| E2E-M-SETTING-03 | 다크 모드 토글 (모바일) | Mobile | F-DARK | S3 |
| E2E-D-SETTING-04 | 다크 모드 FOUC 없음 (새로고침 후 즉시 적용) | Desktop | F-DARK | S3 |
| E2E-D-SETTING-05 | 설정 영속: 폰트 변경 → 새로고침 → 유지 | Desktop | F-PERSIST | S3 |
| E2E-D-SETTING-06 | 설정 영속: 마지막 읽기 위치 복원 | Desktop | F-PERSIST | S1, S3 |

### CONTENT: 콘텐츠 품질 및 표시

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-CONTENT-01 | article 요소 1개 이상 렌더링 | Desktop | F-LAZY | S1 |
| E2E-M-CONTENT-01 | article 요소 1개 이상 렌더링 (모바일) | Mobile | F-LAZY | S1 |
| E2E-D-CONTENT-02 | article 본문 텍스트 10자 이상 | Desktop | F-LAZY | S1 |
| E2E-D-CONTENT-03 | propers 시즌 leaf 클릭 → 본문 로드 | Desktop | F-LAZY, F-NAV | S2, S8 |
| E2E-D-CONTENT-04 | hymns leaf 클릭 → 본문 로드 | Desktop | F-LAZY, F-NAV | S4 |
| E2E-D-CONTENT-05 | week 그룹 간 전환 시 콘텐츠 로드 | Desktop | F-LAZY | S1 |

---

## 3. 요구사항 추적 매트릭스 (RTM)

### 3.1 PRD 기능 → E2E 테스트 매핑

| PRD 기능 ID | 기능명 | 상태 | E2E 테스트 ID | 커버리지 |
|-------------|--------|------|--------------|----------|
| F-NAV | 계층 목차 네비게이션 | ✅ | E2E-D-NAV-01, 02, 04, 06, 07, 08, 10, E2E-M-NAV-09 | 8 tests |
| F-SEARCH | 텍스트 검색 | ✅ | E2E-D-SEARCH-01~06 | 6 tests |
| F-FONT | 폰트 크기 조절 | ✅ | E2E-D-SETTING-01, 02, E2E-M-SETTING-01 | 3 tests |
| F-DARK | 다크 모드 | ✅ | E2E-D-SETTING-03, 04, E2E-M-SETTING-03 | 3 tests |
| F-BREAD | 브레드크럼 | ✅ | E2E-D-NAV-05 | 1 test |
| F-PERSIST | 설정 영속성 | ✅ | E2E-D-SETTING-05, 06 | 2 tests |
| F-LAZY | Lazy loading | ✅ | E2E-D-LOAD-02, 04, 05, E2E-D-CONTENT-01~05, E2E-M-LOAD-02, CONTENT-01 | 10 tests |
| F-SSR | SSR | ✅ | E2E-D-LOAD-01, E2E-M-LOAD-01 | 2 tests |
| F-MOBILE | 모바일 반응형 | ✅ | E2E-M-NAV-03, 09 | 2 tests |
| F-A11Y | 접근성 | ✅ | (ARIA 속성은 NAV/SEARCH 테스트에서 간접 검증) | indirect |
| F-SKEL | 스켈레톤 로딩 | ✅ | E2E-D-LOAD-06 | 1 test |
| F-DVHL | iOS viewport | ✅ | (CSS 속성, E2E로 직접 검증 어려움) | manual |

### 3.2 PRD 미구현 기능 → 테스트 상태

| PRD 기능 ID | 기능명 | 상태 | E2E 계획 | 비고 |
|-------------|--------|------|----------|------|
| F-FULLSEARCH | 본문 검색 | ❌ 미구현 | E2E-D-SEARCH-10 (예정) | 구현 시 추가 |
| F-OFFLINE | 오프라인 | ❌ 미구현 | E2E-M-OFFLINE-01~03 (예정) | PWA 구현 시 추가 |
| F-CALENDAR | 전례력 연동 | ❌ 미구현 | E2E-D-CALENDAR-01 (예정) | 구현 시 추가 |
| F-MARKUP | 전례 텍스트 구조 | ❌ 미구현 | E2E-D-CONTENT-10 (예정) | 구현 시 추가 |
| F-RUBRIC | 루브릭 구분 | ❌ 미구현 | E2E-D-CONTENT-11 (예정) | 구현 시 추가 |
| F-KEYS | 키보드 단축키 | ❌ 미구현 | E2E-D-KEYS-01~05 (예정) | 구현 시 추가 |
| F-PROGRESS | 읽기 진행률 | ❌ 미구현 | E2E-D-NAV-20 (예정) | 구현 시 추가 |

### 3.3 UX 시나리오 → E2E 테스트 매핑

| 시나리오 | 설명 | 관련 E2E 테스트 | 커버리지 |
|----------|------|----------------|----------|
| S1 | 매일 아침기도 (모바일) | E2E-M-LOAD-01, M-LOAD-02, M-NAV-03, M-NAV-09, M-CONTENT-01, D-NAV-08, D-SETTING-06 | 7 tests |
| S2 | 사순 시기 전례 준비 (데스크탑) | E2E-D-LOAD-04, D-NAV-01, D-NAV-04, D-NAV-06, D-NAV-05, D-SETTING-01, D-CONTENT-03 | 7 tests |
| S3 | 야간 기도 (태블릿/다크모드) | E2E-D-SETTING-03, D-SETTING-04, D-SETTING-05, M-SETTING-01, M-SETTING-03 | 5 tests |
| S4 | 찬미가 검색 (모바일) | E2E-M-NAV-03, M-NAV-09, D-SEARCH-04, D-NAV-07, D-LOAD-05, D-CONTENT-04 | 6 tests |
| S5 | 처음 방문 | E2E-D-LOAD-01, M-LOAD-01, D-LOAD-06, D-SETTING-03, D-CONTENT-01, M-CONTENT-01 | 6 tests |
| S6 | 특정 시편 찾기 (데스크탑) | E2E-D-SEARCH-01, D-SEARCH-02, D-SEARCH-03, D-NAV-05 | 4 tests |
| S7 | 오프라인 환경 | (미구현 — F-OFFLINE) | 0 tests |
| S8 | 전례 시기 전환 | E2E-D-NAV-04, D-NAV-06, D-LOAD-04, D-CONTENT-03 | 4 tests |

### 3.4 전체 커버리지 히트맵

```
                   S1  S2  S3  S4  S5  S6  S7  S8
F-NAV              ●   ●   ·   ●   ●   ·   ·   ●
F-SEARCH           ·   ·   ·   ●   ·   ●   ·   ·
F-FONT             ·   ●   ●   ·   ·   ·   ·   ·
F-DARK             ·   ·   ●   ·   ●   ·   ·   ·
F-BREAD            ·   ●   ·   ·   ·   ●   ·   ·
F-PERSIST          ●   ·   ●   ·   ·   ·   ·   ·
F-LAZY             ●   ●   ·   ●   ●   ·   ○   ●
F-SSR              ·   ·   ·   ·   ●   ·   ·   ·
F-MOBILE           ●   ·   ·   ●   ·   ·   ●   ·
F-SKEL             ●   ·   ·   ·   ●   ·   ○   ·
F-FULLSEARCH       ·   ✗   ·   ✗   ·   ✗   ·   ·
F-OFFLINE          ✗   ·   ·   ✗   ·   ·   ✗   ·
F-CALENDAR         ✗   ·   ·   ·   ·   ·   ·   ✗

● = E2E 테스트 커버됨
○ = 부분 커버 (정상 경로만)
✗ = 미구현 기능 (테스트 불가)
· = 해당 시나리오에 불필요
```

---

## 4. 기존 테스트 → 새 ID 매핑

현재 `e2e/reader.spec.ts`의 테스트와 새 ID 대응:

| 기존 테스트 | 새 ID |
|------------|-------|
| 페이지 로드 > 메인 페이지 정상 로드 (desktop) | E2E-D-LOAD-01 |
| 페이지 로드 > 메인 페이지 정상 로드 (mobile) | E2E-M-LOAD-01 |
| 페이지 로드 > 콘텐츠 API 정상 응답 (desktop) | E2E-D-LOAD-02 |
| 페이지 로드 > 콘텐츠 API 정상 응답 (mobile) | E2E-M-LOAD-02 |
| 페이지 로드 > 잘못된 그룹 404 (desktop) | E2E-D-LOAD-03 |
| 페이지 로드 > 잘못된 그룹 404 (mobile) | E2E-M-LOAD-03 |
| 사이드바 데스크탑 > 트리 클릭 네비게이션 | E2E-D-NAV-01 |
| 사이드바 데스크탑 > 토글 열기/닫기 | E2E-D-NAV-02 |
| 사이드바 모바일 > 오버레이 열기/닫기 | E2E-M-NAV-03 |
| 검색 > 검색어 결과 표시 + 클릭 | E2E-D-SEARCH-01 + 02 |
| 읽기 설정 > 폰트 크기 조절 (desktop) | E2E-D-SETTING-01 |
| 읽기 설정 > 폰트 크기 조절 (mobile) | E2E-M-SETTING-01 |
| 읽기 설정 > 다크 모드 토글 (desktop) | E2E-D-SETTING-03 |
| 읽기 설정 > 다크 모드 토글 (mobile) | E2E-M-SETTING-03 |
| 브레드크럼 > 네비게이션 후 존재 | E2E-D-NAV-05 |
| 콘텐츠 로딩 > 본문 로드 (desktop) | E2E-D-CONTENT-01 + 02 |
| 콘텐츠 로딩 > 본문 로드 (mobile) | E2E-M-CONTENT-01 |

**기존 커버리지:** 17 tests → 새 ID 17개 매핑 완료

### 신규 추가 필요 테스트 (구현된 기능 중 미커버)

| 새 ID | 설명 | 우선순위 |
|--------|------|----------|
| E2E-D-LOAD-04 | Content API 200 (propers) | 높음 |
| E2E-D-LOAD-05 | Content API 200 (hymns) | 높음 |
| E2E-D-LOAD-06 | 스켈레톤 → 본문 전환 확인 | 중 |
| E2E-D-NAV-04 | 컨테이너 노드 → 첫 leaf 이동 | 높음 |
| E2E-D-NAV-06 | propers 시즌 하위 목차 표시 | 높음 |
| E2E-D-NAV-07 | hymns 개별 찬미가 목차 표시 | 높음 |
| E2E-D-NAV-08 | week 트리 전체 깊이 탐색 | 중 |
| E2E-M-NAV-09 | 모바일 leaf 클릭 → 스크롤 + 사이드바 닫힘 | 높음 |
| E2E-D-NAV-10 | 활성 항목 사이드바 자동 스크롤 | 저 |
| E2E-D-SEARCH-03 | 시편 번호 "141" 검색 | 중 |
| E2E-D-SEARCH-04 | 찬미가 번호 "42" 검색 | 중 |
| E2E-D-SEARCH-05 | 1자 입력 → 트리 유지 | 저 |
| E2E-D-SEARCH-06 | 결과 없음 메시지 | 저 |
| E2E-D-SETTING-02 | 폰트 축소 | 저 |
| E2E-D-SETTING-04 | FOUC 없음 (다크모드 새로고침) | 중 |
| E2E-D-SETTING-05 | 폰트 설정 새로고침 영속 | 중 |
| E2E-D-SETTING-06 | 마지막 읽기 위치 복원 | 높음 |
| E2E-D-CONTENT-03 | propers leaf 본문 로드 | 높음 |
| E2E-D-CONTENT-04 | hymns leaf 본문 로드 | 높음 |
| E2E-D-CONTENT-05 | 그룹 간 전환 콘텐츠 로드 | 중 |

**신규 추가: 20개** (기존 17 + 신규 20 = 총 37 E2E 테스트)

---

## 5. 테스트 실행 계획

### 5.1 환경

| 항목 | 값 |
|------|-----|
| Framework | Playwright 1.59.1 |
| Desktop viewport | 1280 × 720 |
| Mobile viewport | 375 × 812 |
| Browser | Chromium (headless) |
| Dev server | `npm run dev -- --port 3300` |
| 설정 | `playwright.config.ts` |

### 5.2 실행 명령

```bash
# 전체 실행
npx playwright test

# Desktop만
npx playwright test --project=desktop

# Mobile만
npx playwright test --project=mobile

# 특정 카테고리만
npx playwright test -g "NAV"
npx playwright test -g "SEARCH"
```

### 5.3 CI 통합 (향후)

```yaml
# GitHub Actions
- name: E2E Tests
  run: |
    npm run build
    npx playwright test --reporter=github
```
