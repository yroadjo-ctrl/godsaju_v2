# 만나이 · 대운·세운·소운 나이 규칙

갓사주 v2에서 **표에 쓰는 나이**와 **운 활성 판정** 기준입니다.  
구현: `core/src/age.ts`, `core/src/saju.ts`, `core/src/soun.ts`, `client/src/components/saju/SewoonTable.tsx`, `client/src/utils/yun-period.ts`

> UI·AI 복사의 `※` 안내는 `client/src/utils/yun-method-notes.ts` 요약본입니다.

---

## 1. 만나이 정의

**만나이(생일 기준)** — 한국식 국제 나이.

- 생일 **당일**에만 +1
- 1월 1일에 자동으로 +1 되지 **않음**
- `getManAge(birthY, birthM, birthD, refDate)` — `refDate` 순간의 KST 벽시계 날짜로 판정

---

## 2. 표 칸 나이 (대운 · 세운 · 소운)

모두 **`getManAge` + 해당 칸의 기준 시각** 입니다. (12/31 기준 아님)

| 구분 | 기준 시각 | 헤더 표기 |
|------|-----------|-----------|
| **대운** | 각 運 `startDate` (◆대운 시작) | `N세[O運]` |
| **세운** | 그해 생일 시각 (`출생 월·일·시`를 해당 연도에 적용) | `만N세 M/D` (M/D = 생일) |
| **소운** | 그해 생일 시각 (◆소운 시작) | 연도 + 만나이 |

- 대운·소운·세운 칸의 `age` 필드 = 위 기준 시각의 만나이
- 세운 **간지(流年)** 는 나이와 별도 — 해당 양력년 **◆입춘 직후** 레퍼런스 (`getLiuNianGanziForCalendarYear`)

---

## 3. 소운 칸 수

**1운 `startDate` 연도 − 출생 연도** (양력, 매년 1주).

- 함수: `getSounYearCount(birthYear, firstDaewoonStartDate)`
- 칸 **개수** = 연도 차, 칸 **나이** = §2 소운 기준

---

## 4. ◆시작 · 활성 대운 · 현재 O운

| 판정 | 기준 |
|------|------|
| 첫 대운 전 (소운 구간) | `now < daewoon[0].startDate` |
| 활성 대운 칸 | `now >= 해당 運 startDate` (가장 최근) |
| 현재 세운 | 입춘 기준 적용 연도 (`getEffectiveYunCalendarYear`) |
| 현재 O운 간지 | KST 「지금」+ 입춘·12節·`startDate` |

함수: `yun-period.ts` (`isBeforeFirstDaewoon`, `findActiveDaewoonIndex` 등)

---

## 5. 대운수 표기 vs 1運 ◆시작 만나이

**대운수**(`daewoonSuDisplay`) = 절기일수÷3 반올림 **표기용**.  
**1運 칸 나이** = ◆시작 시점 `getManAge(..., startDate)`.

생일이 ◆시작보다 늦으면 (예: 5월생, 1월 ◆시작) 표기가 1세 차이 날 수 있음.

- ◆시작 당시: 만 9세
- 대운수 표기: 10 (정밀 9.7)

이때 UI·AI에 `formatDaewoonAgeBridgeNote` 안내 (1運만).

**같은 해 세운 칸**은 생일 기준이라 대운 1運 칸 나이와 다를 수 있음 (예: ◆시작 1월 9세, 9월 생일 세운 칸 10세).

---

## 6. 예시 — 1982-05-08 07:00 남 서울

| 항목 | 값 |
|------|-----|
| 대운수 표기 | 10 (정밀 9.7) |
| 1운 ◆시작 | 1992-01-20 01:42 |
| 1운 칸 나이 | 9세 (◆시작 시점) |
| 1992년 세운 칸 | 10세 (1992-05-08 생일) |
| 소운 | 1982~1991, 10칸 |

---

## 7. 시주(時柱) 계산

- **반시**: 30분 경계로 시지 결정
- **통자시/야자시**: `jasiMethod` (`pillars.ts` `calcPillarIndices`)
- 출생 **경도 보정**은 해외 출생 `birth-time-adjustment` 에서만 (시주 주석의 「동경 127.5°」는 사용하지 않음)

---

## 8. 관련 파일

| 파일 | 역할 |
|------|------|
| `core/src/age.ts` | `getManAge` |
| `core/src/saju.ts` | 대운 칸 나이 |
| `core/src/soun.ts` | 소운 칸·칸 수 |
| `client/src/components/saju/SewoonTable.tsx` | 세운 칸·헤더 |
| `client/src/utils/yun-period.ts` | 활성 운·입춘 |
| `client/src/utils/yun-age-notes.ts` | 대운수 vs 1運 안내 |
| `client/src/utils/yun-method-notes.ts` | UI·AI `※` |

---

*갱신: KST 「지금」 통일 · 만나이·문서·미사용 API 정리*
