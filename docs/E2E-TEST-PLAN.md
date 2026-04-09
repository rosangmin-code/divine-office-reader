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

### FLOW: 기도 흐름 — 교차 그룹 네비게이션

| 테스트 ID | 설명 | Viewport | PRD 기능 | 시나리오 |
|-----------|------|----------|----------|----------|
| E2E-D-FLOW-01 | 시편집 연속 섹션 스크롤 연결 (서로 다른 ID) | Desktop | F-NAV | S1, S9 |
| E2E-D-FLOW-02 | 시편집 → 찬미가 → 시편집 교차 이동 (사이드바) | Desktop | F-NAV, F-LAZY | S1, S9 |
| E2E-D-FLOW-03 | 시편집 → 고유문 → 시편집 교차 이동 (사이드바) | Desktop | F-NAV, F-LAZY | S2, S9 |
| E2E-D-FLOW-04 | 본문 내 페이지 참조(х. NNN) 존재 확인 | Desktop | F-XNAV (문서화) | S1, S9 |
| E2E-M-FLOW-05 | 모바일 교차 그룹 이동 후 사이드바 닫힘 | Mobile | F-MOBILE, F-NAV | S1 |

---

## 3. 요구사항 추적 매트릭스 (RTM)

> 전체 요구사항 추적 매트릭스는 [`docs/TRACEABILITY-MATRIX.md`](./TRACEABILITY-MATRIX.md)를 참조하세요.
> PRD 기능 → 단위 테스트 → E2E 테스트 → UX 시나리오 간 매핑이 포함됩니다.

---

## 4. 테스트 실행 계획

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
