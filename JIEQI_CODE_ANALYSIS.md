# 절기(JieQi) 코드 아키텍처

> **갱신:** 2026-05 — `jieqi-lunar.ts` 단일 소스 기준  
> 절기 관련 작업 시 이 문서와 `core/src/jieqi-lunar.ts`를 먼저 확인하세요.

---

## 1. 단일 소스: `core/src/jieqi-lunar.ts`

| 항목 | 내용 |
|------|------|
| 라이브러리 | `lunar-javascript` (`Solar.fromYmd(...).getLunar().getJieQiTable()`) |
| 타임존 | UTC 시각에 **+1시간** → KST (일운 달력·포스텔러 계열과 동일) |
| 24절기 순서 | `JIEQI_LIST` (0=小寒 … 23=冬至) |
| 12節 (월 전환) | 짝수 인덱스만 — `JIEQI_KOR_12` |

### 핵심 함수

| 함수 | 역할 |
|------|------|
| `lookupJieForYear(year, jieIndex)` | 해당 연도·절기 인덱스의 KST 시각 |
| `getLunarMonthIndex(...)` | 생시 기준 명리 월 슬롯 (0=丑月 … 11=子月) |
| `getLunarYearGanIndex(...)` | 입춘(立春, idx=2) 기준 년주 HGANJI 인덱스 |
| `getLunarMonthGanIndex(...)` | 12節 + **五虎遁** → 월주 HGANJI 인덱스 |
| `calcLunarSolarTerms(...)` | 대운용 입·中·出기 시각 |
| `calcLunarMonthBoundaryTerms(...)` | 월지 기준 절입·절출 시각 |
| `buildJieQiCalendarMap(year)` | 일운 달력 — 월·일 → 절기명·시각 |
| `buildJieQiDateKeyMap(years[])` | text-export 일운 — `YYYY-M-D` 키 |
| `getMonthlyJieQiEntries(year, month)` | 양력 1~12월에 들어오는 24절기 전체 |
| `formatMonthlyJieQiCell(year, month, lineBreak?)` | 월운표 절기 셀 (한 달 2개면 줄바꿈) |

---

## 2. 사용처 매핑

| 영역 | 파일 | 절기 소스 |
|------|------|-----------|
| 4주 — 년·월주 | `core/src/pillars.ts` → `calcPillarIndices` | `getLunarYearGanIndex`, `getLunarMonthGanIndex` |
| 4주 — 일·시주 | `core/src/pillars.ts` | `UNIT` 기준점 + 분/일 연산 (절기 무관) |
| 대운 | `core/src/pillars.ts` → `getDaewoon` | `calcSolarTerms` → `calcLunarSolarTerms` |
| 대운 메타 | `core/src/daewoon-meta.ts` | `calcSolarTerms` |
| 월주 근거 UI | `core/src/month-pillar-basis.ts` | `calcLunarMonthBoundaryTerms` |
| 일운 달력 | `client/.../DailyCalendar.tsx` | `buildJieQiCalendarMap`, `getDayPillarForDate` |
| AI 복사 — 일운 | `client/src/utils/text-export.ts` | `buildJieQiDateKeyMap`, `getDayPillarForDate` |
| AI 복사·UI — 월운표 절기 행 | `MonthlyTable.tsx`, `text-export.ts` | `formatMonthlyJieQiCell` |

### `pillars.ts` 래퍼 (하위 호환)

```typescript
calcSolarTerms(...)        → calcLunarSolarTerms(...)
calcMonthBoundaryTerms(...) → calcLunarMonthBoundaryTerms(...)
```

외부에서 `calcSolarTerms` 이름으로 import하는 코드(`daewoon-meta.ts` 등)는 그대로 두고, 내부만 lunar로 위임합니다.

---

## 3. 아직 절기와 분리된 영역

| 영역 | 파일 | 비고 |
|------|------|------|
| **월운 간지** | `core/src/monthly-data.ts` → `calculateMonthGanzi` | **월두법** (양력 1~12월 고정). 절기-timed 流月와 다름 |
| **세운표** | 연간 `getYearGanzi` | 양력 연도 기준, 절기 무관 |

### 일주 · 일진 (통일 완료)

| 용도 | 함수 |
|------|------|
| 사주원국 일주 | `getFourPillars(출생시각, jasiMethod)` |
| 일운 일진 | `getDayPillarForDate(y, m, d)` → 내부 `getFourPillars(y,m,d,12,0)[2]` |

음력 표시만 `lunar-javascript` 사용. 일진 간지는 core 단일 경로.

월운표 안내 문구: *간지는 월두법, 절기 시·분은 lunar+KST* — 두 체계를 혼동하지 않도록 유지.

---

## 4. 월주 계산 흐름 (현재)

```
생년월일시
  → getLunarYearGanIndex   (입춘 전후로 사주년 결정)
  → getLunarMonthIndex     (12節 중 생시 이전 최근 節)
  → getLunarMonthGanIndex  (년간 + 월지 → 五虎遁 → HGANJI)
```

**주의:** 예전 solortoso24 `MONTH[]` 분(minute) 배열 + `t*12+2+so24monthIdx` 공식은 **삭제됨**.  
Git 히스토리에서만 확인 가능.

---

## 5. UI 표시 규칙

### DailyCalendar / 일운 export
- 해당 날짜에 절기가 **들어온 날**만 셀에 표시
- 형식: `절기명 HH:MM`

### MonthlyTable / 월운 export
- 양력 월별로 그 달에 속하는 **24절기 전부** (보통 2개)
- 형식: `한글(漢字)` + 줄바꿈 + `M/D HH:MM`
- export는 `<br>` 구분

---

## 6. 검증

- `test-saju.mjs` — 고정 케이스 (예: 1982-09-08 07:00 → 戊申月, 입추 8/8 05:41)
- 1980–2025 샘플: lunar 월지 vs core 월주 **0 mismatch** (통일 후)
- 변경 후: `pnpm build`

---

## 7. 레거시 (폐기)

| 항목 | 상태 |
|------|------|
| `pillars.ts` `MONTH[]` 배열 | **삭제** (2026-05) |
| solortoso24 절기 분 연산 | `jieqi-lunar`로 대체 |
| `CODE_DUMP_FULL.md` | **삭제** — 소스 파일이 진실(source of truth) |

절기 로직 추가·수정 시 **반드시 `jieqi-lunar.ts`에만** 구현하고, UI/export는 해당 모듈을 import하세요.
