# 모듈 PRD: data-pipeline

> **모듈**: data-pipeline
> **담당 영역**: 소스 데이터 변환, 빌드 파이프라인, 데이터 품질 테스트
> **관련 파일**: `modules/data-pipeline/build-data.ts`, `modules/data-pipeline/__tests__/build-data.test.ts`

---

## 빌드 파이프라인

```
소스 텍스트 (parsed_data/)
  ↓ npm run build:data (DIVINE_OFFICE_SOURCE env)
구조화 JSON (public/data/)
  ↓ npm run build
Next.js 정적 생성 + Route Handler
  ↓ npx vercel --prod
Vercel Production
```

**빌드 타임 QA**: `\f`, `\t`, 빈 제목 자동 검출

### 소스 데이터
- PDF에서 추출한 몽골어 텍스트 (`parsed_data/`)
- 수동 전처리 필요
- 정적 콘텐츠 — 실시간 업데이트 없음

### 출력 데이터
- 6개 그룹 분할 JSON (`public/data/content/`)
- 전체 콘텐츠 통합 JSON (`public/data/content.json`) — 테스트 검증용
- 478개 노드, 최대 depth 5

---

## 데이터 품질 요구사항

### T-CLEAN: 데이터 정제 테스트

| 항목 | 내용 |
|------|------|
| **ID** | T-CLEAN |
| **이름** | 데이터 정제 |
| **상태** | ✅ 구현 완료 |
| **설명** | 빌드된 JSON 파일에서 특수문자(`\f`, `\t`), 빈 제목, 잘못된 문자 인코딩 등을 검출하는 테스트. |
| **단위 테스트** | `tests/build-data.test.ts` — T-CLEAN-01 ~ T-CLEAN-07 (7개) |

**테스트 항목:**

| 테스트 ID | 설명 |
|-----------|------|
| T-CLEAN-01 | form feed (`\f`) 문자 없음 |
| T-CLEAN-02 | tab (`\t`) 문자 없음 |
| T-CLEAN-03 | 빈 제목(title) 없음 |
| T-CLEAN-04 | 빈 본문(body) 없음 |
| T-CLEAN-05 | 연속 공백 3개 이상 없음 |
| T-CLEAN-06 | 선행/후행 공백 없음 (제목) |
| T-CLEAN-07 | null/undefined 값 없음 |

### T-STRUCT: 데이터 구조 테스트

| 항목 | 내용 |
|------|------|
| **ID** | T-STRUCT |
| **이름** | 데이터 구조 검증 |
| **상태** | ✅ 구현 완료 |
| **설명** | 빌드된 JSON 파일의 구조적 정합성 검증. 필수 필드 존재, 데이터 타입, 그룹별 섹션 수 범위 등. |
| **단위 테스트** | `tests/build-data.test.ts` — T-STRUCT-01 ~ T-STRUCT-08 (8개) |

**테스트 항목:**

| 테스트 ID | 설명 |
|-----------|------|
| T-STRUCT-01 | 6개 그룹 JSON 파일 모두 존재 |
| T-STRUCT-02 | 각 섹션에 id, title, body 필드 존재 |
| T-STRUCT-03 | id 값 고유성 (중복 없음) |
| T-STRUCT-04 | week 그룹 섹션 수 50-70 범위 |
| T-STRUCT-05 | propers 그룹 섹션 수 80-100 범위 |
| T-STRUCT-06 | hymns 그룹 섹션 수 100-120 범위 |
| T-STRUCT-07 | bookmarks.json 노드 수 400-500 범위 |
| T-STRUCT-08 | 트리 최대 depth 5 이하 |

### T-SEG: 데이터 분할 테스트

| 항목 | 내용 |
|------|------|
| **ID** | T-SEG |
| **이름** | 데이터 분할 검증 |
| **상태** | ✅ 구현 완료 |
| **설명** | 콘텐츠 그룹 분할의 적절성 검증. 개별 섹션 크기 상한, 그룹 간 ID 겹침 없음 등. |
| **단위 테스트** | `tests/build-data.test.ts` — T-SEG-01 ~ T-SEG-04 (4개) |

**테스트 항목:**

| 테스트 ID | 설명 |
|-----------|------|
| T-SEG-01 | 개별 섹션 body 크기 50KB 이하 |
| T-SEG-02 | 그룹 간 섹션 ID 겹침 없음 |
| T-SEG-03 | 그룹 파일 크기 300KB 이하 |
| T-SEG-04 | 빈 그룹 파일 없음 (섹션 수 > 0) |

---

## 콘텐츠 품질 이슈

| 이슈 | 심각도 | 상세 | 개선 방향 |
|------|--------|------|----------|
| propers 일부 대형 leaf | 중 | `propers-saints-хамаг-гэгээнтнүүд` 49KB, `propers-christmas-...` 32KB | 20KB 이하로 추가 분할 (Phase 1) |
| hymns 단문 항목 | 저 | 109곡 중 7개가 120자 미만 | 원본 확인 후 보완 |
| 제목 중복 | 저 | 67그룹/181건 | 요일별 기도 구조상 불가피 — 브레드크럼으로 구분 |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `modules/data-pipeline/build-data.ts` | 소스 데이터 → JSON 변환 스크립트 |
| `modules/data-pipeline/__tests__/build-data.test.ts` | 데이터 품질 테스트 (T-CLEAN, T-STRUCT, T-SEG) |
| `public/data/content.json` | 전체 콘텐츠 통합 JSON (테스트 검증용) |
| `public/data/content/week1.json` | 1주차 시편집 콘텐츠 |
| `public/data/content/week2.json` | 2주차 시편집 콘텐츠 |
| `public/data/content/week3.json` | 3주차 시편집 콘텐츠 |
| `public/data/content/week4.json` | 4주차 시편집 콘텐츠 |
| `public/data/content/propers.json` | 시기별 고유문 콘텐츠 |
| `public/data/content/hymns.json` | 찬미가 콘텐츠 |
